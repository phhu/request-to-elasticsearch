const elasticsearch = require('elasticsearch');
const {WritableBulk,TransformToBulk} = require('elasticsearch-streams');

module.exports = ({
  index,
  esType = "doc",
  idFromDoc,
  elasticsearch:esConfig,
}={}) => ({
  handleResult = (err, resp) => {} 
}={}) => {

  const client = new elasticsearch.Client(esConfig);
  const ws = new WritableBulk((bulkCmds, callback)=> client.bulk({
    index,
    type: esType,
    body: bulkCmds,
  }, (err,resp) => {
    callback(err,resp);
    handleResult(err,resp);   
  })); 
  const toBulk = new TransformToBulk(doc => ({ _id: idFromDoc(doc) })); 
  toBulk
    .pipe(ws)
    .on('finish', ()=>console.log("finished"))
  ;

  return {
    sendForUpload: item=> toBulk.write(item),
    close: ()=> toBulk.end(),
    getResultItems: propOr([],'items'),
    resultMapping: r => r.items.map(o=>({
      id:o.index._id,
      result: o.index.result
    })),
  };
};

