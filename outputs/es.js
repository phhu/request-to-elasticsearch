/** 
 * ES steams used to collect up input.
 * Generally it's a bit complex owing to mixture 
 * of promises and streams. But it works :-)
 */

const elasticsearch = require('elasticsearch');
const {WritableBulk,TransformToBulk} = require('elasticsearch-streams');
const {
  evolve, add, concat, inc
} = require('ramda');
const outputStats = require('../outputStats');

const resultMapping = r => r.items.map(o=>({
  id:o.index._id,
  result: o.index.result
}));

module.exports = ({
  index,
  esType = "doc",
  idFromDoc,
  esConfig,
}={}) => ({
  handleResult = (err, resp) => {} 
}={}) => {
  let stats = outputStats.getStats();
  const client = new elasticsearch.Client(esConfig);
  const reqPromises = [];   // stream will finish before bulks are done by ES client, so track
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
  const toBulk = new TransformToBulk(doc => ({ _id: idFromDoc(doc) })); 
  toBulk.pipe(ws);
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
    sendForUpload: item=> toBulk.write(item),
    close: ()=> {
      toBulk.end();
    },
    getStats: ()=>stats,
  };
};

