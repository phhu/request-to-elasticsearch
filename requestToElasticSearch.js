// FP using ramda
const {map,pipe,tap,last,evolve,then,otherwise} = require('ramda');
const {handleError, tapper, forceToPromise, writeFile} = require('./utils');

const configName = process.argv[2] || 'jiraSampleConfig';  
const config = require('./' + configName)();    //config file handles other params
console.log(
  "config file: ", configName, 
  "Base URL: ", config.initialRequest.uri, 
"\n");

//use promise limit to prevent too many simultaneous requests
const limit = require('p-limit')(config.limit);
const rp = require('request-promise-native');

// set up stream for bulk writing to ES
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client(config.elasticsearch);
const {WritableBulk,TransformToBulk} = require('elasticsearch-streams');

const stats = {
  itemsFound:0,
  itemsSentForUpload: 0,
  itemsUploaded:0,
  requestsSent:0,
  requestsResolved:0,
  batchesUploaded: 0,
  //errors:[],
  results:[],
  requests:[],
};

const shortStats = ()=> evolve({
  results:last,requests:last
},stats);

const handleEsResult = (err,resp) => {
  if (err){console.err(err)}
  stats.batchesUploaded += 1;
  stats.itemsUploaded += resp.items.length;
  stats.results = stats.results.concat(resp.items.map(o=>({
    id:o.index._id,
    result: o.index.result
  })));
  console.log(
    "handling ES result: batch:",stats.batchesUploaded, 
    "items: ", resp.items.length, 
    shortStats(),
    //stats,
    //resp.items.map(o=>o.index._id + ":" + o.index.result).join(" ")
  );
  checkIfDone("after handleEsResult");
}
const ws = new WritableBulk((bulkCmds, callback)=> client.bulk({
  index : config.index,
  type  : config.esType || '_doc',
  body  : bulkCmds,
}, (err,resp)=>{
  callback(err,resp);
  handleEsResult(err,resp);
}));
const toBulk = new TransformToBulk(doc => ({ _id: config.idFromDoc(doc) })); 
toBulk
  .pipe(ws)
  .on('finish', ()=>console.log("finished"))
;

const checkIfCompletedUsingStats = ()=> (
  stats.itemsFound === stats.itemsSentForUpload && 
  stats.requestsSent ===stats.requestsResolved
)

const checkIfDone = (label) => {
  const done = checkIfCompletedUsingStats();
  //console.log("checkIfDone:", label,done);  // , shortStats()
  if (done){
    console.log("Done, so ending bulk.",label, done);
    toBulk.end()
  }
}

const runRequest = req => pipe(
  tap(req => stats.requests.push(req.uri)),
  tap(req => stats.requestsSent += 1),
  req => limit((config.requestor || rp),req),   //encodeURI(url)
  then(pipe(       // res passes through this
    (config.parseResponse || JSON.parse),
    //tap(writeFile('out/res.json')),
    tap(res=> pipe(    // get items
      config.getItems(req),
      //tapper("got items"),
      tap(items=>stats.itemsFound += items.length),
      map(pipe(
        uploadItem(req)(res),
        then(pipe(
          tap(x=>stats.itemsSentForUpload += 1),
          tap(x=>checkIfDone("afterUploadItem")),
        )),

      )),
    )(res)),
    tap(pipe(      // get more requests
      config.getNextRequests(req),
      map(runRequest),
    )),
    tap(x=>stats.requestsResolved += 1),
    tap(x=>checkIfDone("afterReqResolved")),
  )),
  otherwise(handleError("error in runRequest")),
)(req);

const uploadItem = req => res => pipe(
  //tapper("premod"),
  config.modifyItemBeforeUpload(req)(res),
  forceToPromise,    // in case modification isn't promise
  //tapper("postmod"),
  then(pipe(
    //tapper("modified"),
    //tap(writeFile('out/modified.json')),
    item=>toBulk.write(item),
  )),
  otherwise(handleError("error uploading item"))
);

runRequest(config.initialRequest);