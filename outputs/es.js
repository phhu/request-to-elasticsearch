/** 
 * ES steams used to collect up input.
 * Generally it's a bit complex owing to mixture 
 * of promises and streams. But it works :-)
 */

const elasticsearch = require('elasticsearch');
const {WritableBulk} = require('elasticsearch-streams');
const TransformToBulk = require('./es_transformToBulk');
const through2map = require("through2-map"); //.objCtor([options,] fn)
const {
  evolve, add, concat, inc
} = require('ramda');
const outputStats = require('../outputStats');

const resultMapping = r => r.items.map(o=>{
  const out = o.index || o.update || {};
  return {
    id: out._id,
    result: out.result,
  };
});

module.exports = ({
  index,
  esType = "doc",
  idFromDoc,
  esConfig,
  esDocTransform = x=>x,
  esAction = 'index',  // or update 
}={}) => ({
  handleResult = (err, resp) => {} 
}={}) => {
  let stats = outputStats.getStats();
  const client = new elasticsearch.Client(esConfig);
  const reqPromises = [];   // stream will finish before bulks are done by ES client, so track

  const inputMapping = through2map({objectMode:true},esDocTransform);

  const ws = new WritableBulk(
    (bulkCmds, callback)=> reqPromises.push(
      client.bulk({
        index,
        type: esType,
        body: bulkCmds,
      }).then(res => {
        callback(null,res);
        stats = evolve({
          itemsUploaded: add(res.items.length),
          batchesUploaded: inc,
          results: concat(resultMapping(res)),
        }, stats);
        handleResult(null,res);   
      }).catch(err => {
        callback(err,null);
        handleResult(err,[]); 
      })
    )
  ); 
  const toBulk = new TransformToBulk(doc => ({ _id: idFromDoc(doc) }),esAction);    // or update 
  inputMapping.pipe(toBulk).pipe(ws);
  // on finish, need to check that all promises have resolved, as these are beyond the stream
  ws.on('finish', ()=>{
    Promise.all(reqPromises).then(res => {
      console.log(
        "Finished ES toBulk",
        //stats,
        outputStats.shortStats(stats)
      )
    });
  });

  return {
    sendForUpload: item=> inputMapping.write(item),
    close: ()=> {
      inputMapping.end();
    },
    getStats: ({short=false})=>short? outputStats.shortStats(stats):stats,
  };
};

