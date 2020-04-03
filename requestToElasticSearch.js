// FP using ramda
const {
  map,pipe,tap,last,evolve,then,otherwise,
  inc,add,concat,length, forEach, slice,ifElse, defaultTo,
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
const limit = require('p-limit')(config.limit);   // config.limit

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
  //forEach(o=>{console.log(o.getStats({short:true}))},outputs);
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

//fake response could just be json, taken after the parser?
config.parseResponse = config.parseResponse || (x=>JSON.parse(x));
const fakeRes = config.parseResponse(defaultTo( `[]`,config.fakeResponse));
const reqToString = req => (req.uri || req.cmd || req.file || req.toString());


const getNextReqs = req=> pipe(
  tap(pipe(      // get more requests
    config.getNextRequests(req),
    map(x=>(limit(runRequest,x))),
    /*map(nextReq => limit(
      (x)=>Promise.resolve(
        runRequest(x).then(()=>console.log(1))
      )
      ,nextReq
    )),*/
  )),
);

// wrapping runRequest in promise.resolve helps to prevent stack overflow / allows limiting
const runRequest = req => Promise.resolve(pipe(     //req flows through this
  //tap(req => console.log("Starting request: ",reqToString(req).substr(0,200)  )),
  //tap(req => printStatsIfChanged()),
  tap(req => stats.requests.push('' + reqToString(req))),
  tap(req => stats.requestsSent += 1),
  tap(req => ifElse(
    ()=>config.makeNextRequestBeforeResponseReceived,
    req => getNextReqs(req)(fakeRes),
    ()=>{},
  )(req)),
  requestor,
  //req => limit(requestor,req), 
  then(pipe(       // res passes through this
    // in some cases, don't need to bother getting res for next req... 
    // need to accomoate this somehow.
    // maybe a fake res param too in case of error
    (config.parseResponse || JSON.parse),
    //tap(writeFile('out/res.json')),
    tap(x=>stats.requestsResolved += 1),
    //tap(x=>checkIfDone("afterReqResponse")),
    //tap(x=>checkIfDone("afterReqResolved")),
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
    ifElse(
      ()=>config.makeNextRequestBeforeResponseReceived,
      ()=>()=>{},
      getNextReqs(req),
    ),
    /*tap(pipe(      // get more requests
      config.getNextRequests(req),
      map(runRequest),
    )),
    tap(x=>stats.requestsResolved += 1),
    tap(x=>checkIfDone("afterReqResolved")),*/
  )),
  otherwise(err => {
    stats.requestsResolved += 1;
    checkIfDone("afterReqError")
    //handleError("error in runRequest")(err.message.substring(0,100) + ' '+  req.uri);
    if(!config.makeNextRequestBeforeResponseReceived){
      getNextReqs(req)(fakeRes)
    }
  }),
)(req));

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