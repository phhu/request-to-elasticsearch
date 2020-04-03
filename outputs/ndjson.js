const ndjson = require('ndjson');
const fs = require('fs');
const outputStats = require('../outputStats');
const JSONStream = require('JSONStream');

const {
  always, identity, map, evolve, inc,append
} = require('ramda');

module.exports = ({
  filename = "out/test.json"
}={}) => ({
  handleResult = (err, resp) => {} 
}={}) => {

  let stats = outputStats.getStats();

  const serialize = ndjson.serialize();
  //const serialize = JSONStream.stringify(false);   // seems not to handle trailing lines well
  
  serialize.on('data', function(line) {
    //console.log("data",line);
    stats = evolve({
      itemsUploaded: inc,
      batchesUploaded: inc,
      results: append((line).substr(0,250)),
    },stats);
    handleResult(null,[line]);   
  })
  const ws = fs.createWriteStream(filename);
  serialize.pipe(ws);
  ws.on('finish', ()=> {
    console.log("closing ndjson stream:", filename, outputStats.shortStats(stats));
  });

  return {
    sendForUpload: item=> serialize.write(item),
    close: ()=> serialize.end(),
    getStats: ({short=false})=> short? outputStats.shortStats(stats):stats
  };
};