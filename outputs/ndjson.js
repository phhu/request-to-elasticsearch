const ndjson = require('ndjson');
const fs = require('fs');
const outputStats = require('../outputStats');

const {
  always, identity, map, evolve, inc,append
} = require('ramda');

module.exports = ({
  filename = "out/test.ndjson"
}={}) => ({
  handleResult = (err, resp) => {} 
}={}) => {

  let stats = outputStats.getStats();

  const serialize = ndjson.serialize();
  serialize.on('data', function(line) {
    //console.log("data",line);
    stats = evolve({
      itemsUploaded: inc,
      batchesUploaded: inc,
      results: append(line.substr(0,250)+"..."),
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
    close: ()=> {

      serialize.end();
    },
    //getItemCount: always(1), 
    //resultMapping: map(r=>r.substr(0,60)+"..."),
    getStats: ()=>stats
  };
};