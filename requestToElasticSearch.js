// FP using ramda
const {
  map,pipe,tap,last,evolve,then,otherwise,
  inc,add,concat,length, forEach, slice,
} = require('ramda');
const {
  handleError, tapper, forceToPromise, writeFile,
  propArrayLength
} = require('./utils');

const configName = process.argv[2] || 'jiraSampleConfig';  
const config = require('./' + configName)();    //config file handles other params
console.log(
  "config file: ", configName, 
  "Base URL: ", config.initialRequest.uri || config.initialRequest.cmd, 
"\n");

//use promise limit to prevent too many simultaneous requests
const limit = require('p-limit')(config.limit);

let stats = {     // let because we use evolve on this 
  requests:[],
  requestsSent:0,                     // t2
  requestsResolved:0,                 // t2  
  itemsFound:0,                       // t1
  itemsSentForUpload: 0,              // t1
};

const shortStats = ()=> evolve({
  //results:last,
  requests:slice(-2,0),
},stats);
const vShortStats = ()=> 
`${stats.requestsSent}/${stats.requestsResolved},${stats.itemsSentForUpload}/${stats.itemsFound}` 

let lastStats = '';
const printStatsIfChanged = () => {
  if (lastStats != vShortStats()){
    lastStats = vShortStats();
    process.stdout.write(lastStats + ' ');
  }
};

const handleResult = (err,resp) => {
  if (err){console.error("handleResult",err)}
  checkIfDone("after handleResult");
}

let closeAlreadyRequested = false;
const checkIfCompletedUsingStats = ()=> (
  stats.itemsFound === stats.itemsSentForUpload && 
  stats.requestsSent ===stats.requestsResolved
)
const checkIfDone = (label) => {
  printStatsIfChanged();
  if (!closeAlreadyRequested && checkIfCompletedUsingStats()){
    console.log("\nCheckIfDone true, so closing:",label);
    forEach(o=>o.close(),outputs);
    closeAlreadyRequested = true;
  }
}

const requestor = (config.requestor || require('inputs/rp')({}) );
const outputs = config.outputs.map(o => o({handleResult}));

const runRequest = req => pipe(
  tap(req => console.log("Requested: ",req.uri || req.cmd)),
  tap(req => stats.requests.push('' + (req.uri || req.cmd))),
  tap(req => stats.requestsSent += 1),
  req => limit(requestor,req), 
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
    x=>forEach(o=>o.sendForUpload(x),outputs),
  )),
  otherwise(handleError("error uploading item"))
);

runRequest(config.initialRequest);