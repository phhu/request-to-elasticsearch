
// a basic wrapper around rp - for consistency with other inputs

// replace with https://www.npmjs.com/package/node-fetch ?

const rp = require('request-promise-native');

module.exports = ({
 // no config options needed
}={}) => rp;