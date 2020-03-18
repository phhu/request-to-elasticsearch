const elasticsearch = require('elasticsearch');
const {WritableBulk,TransformToBulk} = require('elasticsearch-streams');
const {
  propOr, evolve, add, concat
} = require('ramda');


module.exports = ({
  index,
  esType = "doc",
  idFromDoc,
  esConfig,
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
    close: ()=> {
      console.log("closing es toBulk");
      toBulk.end();
    },
    //getItemCount: pipe(propOr([],'items'),length),
    resultMapping: r => r.items.map(o=>({
      id:o.index._id,
      result: o.index.result
    })),
    /*updateStats: resp => stats => {
      const items = propOr([],'items');
      return evolve({
        itemsUploaded: add(items.length) 
      },stats)
    },*/
  };
};

