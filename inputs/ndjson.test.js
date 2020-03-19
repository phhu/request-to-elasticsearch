const file = require('./ndjson')
;

file()({file:'./out/test.ndjson'})
  .then(console.log)
  ;