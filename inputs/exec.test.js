const exec = require('./exec');

exec()({cmd:'git log --max-count=2 --skip=2'})
  .then(console.log)
  ;