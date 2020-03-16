// FP using ramda
const {pathOr,match,assoc,uniq,evolve,join,reject,isNil,is,tap,map,propOr,
  pipe,ifElse,has,concat,always, prop,mergeLeft,lift,omit} = require('ramda');
const {renameKeys,renameKeysWith} = require('ramda-adjunct');
const raiseKey = key => lift (mergeLeft) (prop (key), omit ([key]));
const {toCamelCase} = require('./utils');
const UrlAssembler = require('url-assembler');

// see https://support.atlassian.com/jira-software-cloud/docs/advanced-search-reference-jql-fields/
const makeReq = ({      
  startAt = 0, 
  maxResults = 50, 
  updatedSince = process.argv[3] || "-24h", 
  project = process.argv[4] || 'PROJ',
} = {}) => ({    
  uri: UrlAssembler('https://yourco.jira.com/rest/api/2/search')
    .query({
      jql: `project in (${project}) and updated>"${updatedSince}"`,
      fields: '*all,comment',
      startAt,
      maxResults,
      expand: 'names',
    }).toString(),
  auth: require('config/_auth.json'),   // {"user": "somebody@yourco.com","pass": "xxxxxxxxxxxx"}
});

module.exports = (config = {}) => ({
  elasticsearch: {
    host: 'elasticsearch:9200',
    log: 'info'    //  'trace'
  }
  ,index:'bugs'
  ,idFromDoc: propOr('fakeId','key')
  ,limit: 60
  //,parseResponse: JSON.parse    //JSON.parse is default: but could overridden
  // return a request object. See https://www.npmjs.com/package/request-promise
  //,requestor: rp       // something that takes an object and returns a promise of data
    // require('../puppet').getData({})  is an alternative requestor using chromium
  ,initialRequest: makeReq(config)
  ,getNextRequests: req => ifElse(
    res => (res.startAt + res.maxResults < res.total) ,    
    res => [makeReq({
      ...config,
      startAt: res.startAt + res.maxResults,
    })],
    always([]),
  )
  // given a response, find any items to upload on it
  ,getItems: req=> propOr([],'issues')
  ,modifyItemBeforeUpload: req => res => pipe(
    raiseKey('fields'),
    reject(isNil),
    renameKeys(res.names),
    renameKeysWith(toCamelCase),
    omit(['expand']),
  )
});