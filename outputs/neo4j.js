// docker run --name neo4j -p 7474:7474 -p 7687:7687 --env NEO4J_AUTH=neo4j/test --env NEO4J_dbms_connector_bolt_advertised__address="localhost:7687" --rm -it neo4j

/*
 MERGE (michael:Person { name: 'Michael Douglas' })
RETURN michael.name, michael.bornIn
*/
const neo4j = require('neo4j-driver');
const {
  add,inc,append,evolve, concat,  pick
  //propOr,pipe,map,join,length
} = require('ramda');
const outputStats = require('../outputStats');

const getResultSummary = res => {
  try {
    return res.records.map(r=>pick(
      ['id','key','name','hash'],
      r._fields[0].properties,
    ));
  } catch (e){
    console.error("error extracting neo4j value",e);
    return [e];
  }
}

module.exports = ({
  address = 'neo4j://localhost',
  auth = neo4j.auth.basic('neo4j', 'test'),
  sessionConfig = {
    database: 'neo4j',
    defaultAccessMode: neo4j.session.WRITE
  },
  cypher ='',
}={}) => ({
  handleResult = (err, resp) => {},
}={}) => {
  const driver = neo4j.driver(address, auth);
  let stats = outputStats.getStats();
  const sessionPromises = [];
  return {
    sendForUpload: item => {
      //console.log("neo4j for upload",item);
      const session = driver.session(sessionConfig);
      sessionPromises.push(session
        .run(cypher,item)
        .then(res => {
          stats = evolve({
            itemsUploaded: add(res.records.length),
            batchesUploaded: inc,
            results: concat(getResultSummary(res)),
          }, stats);
          return handleResult(null,res);
        })
        .catch(err=> handleResult(err,null))
        .finally(x=>session.close())
      );
      return true;  // return now so flow continues
    },
    close: async (callback) => {
      Promise.all(sessionPromises)
        .then(res=>{
          console.log("closing neo4j driver" , outputStats.shortStats(stats));
          return driver.close();
        })  
    },
    getStats: ({short=false})=>short? outputStats.shortStats(stats):stats
  };
};
