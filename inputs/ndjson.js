const 
  fs = require('fs')
  ,streamPromise = require("stream-promise")
  ,ndjson = require('ndjson')
;

// should possibly use streams in main process rather than promises?
// but item and next request extraction potentially needs whole lot.
// Maybe make it optional to use steams where possible?

module.exports = ({
  // no config at moment
}={}) => async ({
  file        
}) => {
  try {
    return streamPromise(
      fs.createReadStream(file)
        .pipe(ndjson.parse())
    );
  } catch (e) {
    console.error("file.js error reading file", e); // should contain code (exit code) and signal (that caused the termination).
  } 
};