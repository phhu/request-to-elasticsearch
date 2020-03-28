Node.js code for indexing from an HTTP API to Elasic Search, using request and elastic search stream modules 

Used for indexing from Jira and Artifactory to ES.

To use, clone, install node.js, run ```npm install```, then call requestToElasticSearch.js with node. First param to requestToElasticSearch.js is the config file to use. This will be ```require```'d. Subsequent params are generally speicifed in the config file: in this example, getting Jira items updated in past 24 hours: 

```node requestToElasticSearch.js jiraSampleConfig -24h``` 


improvements
============

Use fetch rather than rp https://www.npmjs.com/package/node-fetch

Use https://www.npmjs.com/package/JSONStream to get json 

Use rxjs - reactive streams  (*)

Use transducers / steams https://simplectic.com/blog/2015/ramda-transducers-logs/

* steam data (could also use stdin etc)
* convert to object stream (json parse or whatever(
* transduce (mapping)

- one stream of requests
  - which adds events to stream of data

See https://levelup.gitconnected.com/limit-concurrency-with-rxjs-and-promises-78590d2c85d0 for deferral method - similar to plimit

```js

async function getData(x) {
  const response = await request.get(`https://httpbin.org/get`, {
    qs: { time: new Date(), id: x },
    json: true
  });
  console.log(response.args.time);
}

const observables = ids.map(x => defer(() => getData(x)));
from(observables)
  .pipe(mergeAll(5))
  .subscribe();
```