
// a basic wrapper around rp - for consistency with other inputs

// replace with https://www.npmjs.com/package/node-fetch ?

const rp = require('request-promise-native');
const {fallback} = require('fallback-plan');
const {propOr,merge} = require('ramda');

module.exports = ({
 // no config options needed
}={}) => spec => fallback([
  ()=>rp(spec),
  ...(
    propOr([],'backupUris',spec)
      .map(uri => 
        () => {
          spec.uri = uri;    // slightly bad hack to mutate the uri - better to create 
          return rp(merge(spec,{uri}));
        }
      )
  )
]);

/*
} rp(spec).catch(
  ifElse(()=>spec.backupUri),

)*/