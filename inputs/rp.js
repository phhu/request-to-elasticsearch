
// a basic wrapper around rp - for consistency with other inputs

const rp = require('request-promise-native');

module.exports = ({
 // no config options needed
}={}) => rp;