const {pipe,tap,add} = require('ramda');
const R = require('ramda');


const p2 = pipe(
  add(10),
  add(10)
);

const p1 = pipe(
  add(1),
  add(1),
  p2
);

x = p1(1);

console.log(x);
/*
const pr = () => new Promise (resolve,reject){
  try {
    let a = 1/ 0;
    resolve(a);
  } catch (e)
    reject(e);
  }
}*/

Promise.resolve(1).then(console.log);
console.log(2);