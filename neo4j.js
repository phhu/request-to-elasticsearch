// docker run --name neo4j -p 7474:7474 -p 7687:7687 --env NEO4J_AUTH=neo4j/test --env NEO4J_dbms_connector_bolt_advertised__address="localhost:7687" --rm -it neo4j

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
/*
const run = callback => cypher => params => 
  session
    .run(cypher,params)
    .then(res => callback(res))
  /*.subscribe({
    onKeys: keys => {
      console.log("keys",keys)
    },
    onNext: data => {
      console.log("data", data);
      console.log(data.get('name'))
    },
    onCompleted: () => {
      console.log('completed');
    },
    onError: err => {
      console.error(err)
    },
  })*/
;

const close = async () => {
  await session.close();
  await driver.close()  
}

session
  .run('MERGE (james:Person {name: $nameParam}) RETURN james.name AS name', {
    nameParam: 'Bob'
  })
  .subscribe({
    onKeys: keys => {
      console.log("keys",keys)
    },
    onNext: data => {
      console.log("data", data);
      console.log(data.get('name'))
    },
    onCompleted: () => {
      console.log('completed');
      session.close()
        .then(x=>console.log("x",x));
      driver.close()
    },
    onError: err => {
      console.error(err)
    },
  })
;


module.exports = {
  run, close
};
*/