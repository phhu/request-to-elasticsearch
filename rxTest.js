/*
import { of } from 'rx';
import RxNode from 'rx-node';
*/
const Rx = require('rx')
  ,RxNode = require('rx-node')    // https://github.com/Reactive-Extensions/rx-node/blob/master/doc/api/nodejs.md
  //,{fromFetch,switchMap} = require('rx')
  ;

var subscription = RxNode.fromStream(process.stdin)
    .map(x=>x.toString().trim() + "a")
    .subscribe(console.log);

const data$ = Rx.Observable.fromFetch('http://localhost:9200/')
  .pipe( switchMap(response => {
    if (response.ok) {
      // OK return data
      return response.json();
    } else {
      // Server is returning a status requiring the client to try something else.
      return of({ error: true, message: `Error ${response.status}` });
    }
  }),
  catchError(err => {
    // Network or other error, handle appropriately
    console.error(err);
    return of({ error: true, message: err.message })
  })
 );
  
 data$.subscribe({
  next: result => console.log(result),
  complete: () => console.log('done')
 })
