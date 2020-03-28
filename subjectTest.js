//const { root } = require('rxjs/internal-compatibility');
//const fetch = require('node-fetch');

//const AbortController = require('abort-controller');
const { range, of, Subject , from, defer} = require( 'rxjs');
const { 
  tap,map, filter, switchMap, catchError, mergeMap, mergeAll , takeUntil,
  scan,
} = require('rxjs/operators');
//const { fromFetch } = require('rxjs/fetch');
const { add,multiply, modulo,__ , ifElse , prop} = require('ramda');

const request = require('request-promise-native');

//root.fetch = fetch;
//root.AbortController = AbortController;

const URL = 'https://httpbin.org/get';

 getData = async (req) => ({
  req,
  res: await request.get(req)
});

const getItems = ({req,res})=>([
  {...res.args,}
])

const getNextReqs = ({req,res}) => {
  const id = parseInt(res.args.id)+1;
  return id> 4 ? [] : [
    getReq({id}),
    getReq({id}),
    //getReq({id}),
  ];
};

const getReq = ({
  id,
}={}) => {
  return {
    uri: URL,
    qs: { 
      time: new Date(),
      id,
    },
    json: true
  }
}

const reqSubject = new Subject();
const itemSubject = new Subject();

const tapGetThings = (getter, subject) => 
  tap(
    rr => getter(rr).map(x=>subject.next(x))
  );
let i = 0;
const end$ = new Subject();

const makeCounter = () => new Subject()
  .pipe(scan((acc,cur)=>acc+cur,1));
const tapStat = name => tap(()=>stats[name].next(1));
const stats = {
  reqsStarted$: makeCounter(),
  reqsFinished$: makeCounter(),
  itemsFound$: makeCounter(),
  itemsSent$: makeCounter(),
}

const req$ = reqSubject.pipe(
  tapStat('reqsStarted$'),
  mergeMap(x=>defer(()=>getData(x)),20),   // concurrency limit
  tapStat('reqsFinished$'),
  tapGetThings(getNextReqs,reqSubject),
  tapGetThings(getItems,itemSubject),
);

//req$.subscribe(x=>console.log("subRes x",x.res.args));
req$.subscribe();
const item$ = itemSubject.pipe(
  tapStat('itemsFound$'),
  map(x=>x),
  tapStat('itemsSent$'),
  takeUntil(end$),
);
//item$.subscribeOnCompleted(() => console.log("item$ end"));
item$.subscribe(x=>console.log("subItem1",x));
item$.subscribe(
  x=>console.log("subItem2",x),
  ()=>{},
  ()=>console.log("item stream completed"),
);

reqSubject.next(
  getReq({id:0}),
);
