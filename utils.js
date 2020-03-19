const fs = require('fs');
const {
  tap, pipe, propOr,length,
  mergeLeft, lift,prop, omit,
} = require('ramda');

module.exports = utils = {
  handleError: tag => e=>console.error(tag,e),
  tapper: label => tap(x=>console.log(label,x)),
  forceToPromise: x=> Promise.resolve(x),
  writeFile: name => item => fs.writeFile(
    name,
    JSON.stringify(item,null,2),
    x=>console.log("wrote file: ", name)
  ),
  toCamelCase: str => str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    .replace(/^\w/, c => c.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, "")
  ,
  propArrayLength: prop => pipe(propOr([],prop),length),
  xmlEscape: str => (''+str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;'),
  raiseKey: key => lift (mergeLeft) (prop (key), omit ([key])),
  getAttr:(name,val) => (val ? `${name}="${utils.xmlEscape(val)}"` : ''),
};
