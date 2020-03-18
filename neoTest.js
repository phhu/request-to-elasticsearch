const n = require('./neo4j');

const addRecord = n.run(
  'MERGE (james:Person {name: $nameParam}) RETURN james.name AS name'
);


  addRecord({
    nameParam: 'Bob'
  })
  .then(result =>{
    console.log(result);
    n.close();
  })