const {
  evolve,slice,last
} = require('ramda');

module.exports = {
  getStats: () => ({
    itemsUploaded:0,
    batchesUploaded: 0,
    results:[],
    errors:[],   
  }),
  modifyStats: transforms => stats => 
    evolve(transforms,stats),
  shortStats: stats => evolve({
    results: x=>[x[0],last(x)]
  },stats),

}