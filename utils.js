const fs = require('fs');

module.exports = {
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
}