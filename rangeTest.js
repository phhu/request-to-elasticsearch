const { root } = require('rxjs/internal-compatibility');
const fetch = require('node-fetch');

const AbortController = require('abort-controller');
const { range, of, Subject } = require( 'rxjs');
const { map, filter, switchMap, catchError } = require('rxjs/operators');
const { fromFetch } = require('rxjs/fetch');
const { add,multiply, modulo,__ , ifElse , prop} = require('ramda');

root.fetch = fetch;
root.AbortController = AbortController;
 
const isOdd = modulo(__, 2);

const reqs = new Subject();

/*     
range(1, 10).pipe(
  filter(isOdd),
  map(multiply(3))
).subscribe(console.log);
*/

const errorCatcher = catchError(err => {
  console.error(err);
  return of({ error: true, message: err.message })
});

const getRequests = req => prop('clustername');

const data$ = fromFetch('http://localhost:9200/').pipe(
  switchMap(ifElse(
    prop('ok'), 
    r=>r.json(), 
    r=>of({ error: true, message: `Error ${r.status}` })
  )),
  errorCatcher
);
//.subscribe(console.log);

data$.subscribe(console.log);
/*
  {
    next: result => console.log(result),
    complete: () => console.log('done')
   }
*/