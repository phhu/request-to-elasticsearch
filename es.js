const neo4j = require('neo4j-driver');
//const {map,concat} = require('ramda');

module.exports = ({
  address = 'neo4j://localhost',
  auth = neo4j.auth.basic('neo4j', 'test'),
  sessionConfig = {
    database: 'neo4j',
    defaultAccessMode: neo4j.session.WRITE
  }
}={}) => {
  const driver = neo4j.driver(address, auth);
  const session = driver.session(sessionConfig);
  return {
    upload: callback => cypher => params => 
      session
        .run(cypher,params)
        .then(res => callback(res)),
    close: async (callback) => {
      await session.close();
      return driver.close();  
    }
  };
};