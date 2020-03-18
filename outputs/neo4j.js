// docker run --name neo4j -p 7474:7474 -p 7687:7687 --env NEO4J_AUTH=neo4j/test --env NEO4J_dbms_connector_bolt_advertised__address="localhost:7687" --rm -it neo4j

/*
 MERGE (michael:Person { name: 'Michael Douglas' })
RETURN michael.name, michael.bornIn
*/
const neo4j = require('neo4j-driver');
const {propOr,pipe,map,join} = require('ramda');
//const {map,concat} = require('ramda');

module.exports = ({
  address = 'neo4j://localhost',
  auth = neo4j.auth.basic('neo4j', 'test'),
  sessionConfig = {
    database: 'neo4j',
    defaultAccessMode: neo4j.session.WRITE
  },
  cypher ='',
}={}) => ({
  handleResult = (err, resp) => {} ,
}={}) => {
  const driver = neo4j.driver(address, auth);

  return {
    sendForUpload: item => {
      const session = driver.session(sessionConfig);
      return session
        .run(cypher,item)
        .then(res => handleResult(null,res))
        .catch(err=> handleResult(err,null))
        .finally(x=>session.close())
      ;
    }
      ,
    close: async (callback) => {

      return driver.close();  
    },
    getResultItems: propOr([],'records'),
    resultMapping: pipe(
      propOr([],'records'),
      map(pipe(
        propOr([],'_fields'),
        map(pipe(
          propOr({},'properties'),
          x=>({id:x.id}),  
        )),
        //join(' | '),
      )),
    ),
  };
};
