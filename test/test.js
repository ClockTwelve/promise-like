import Promise from '../src/index'

var p = new Promise(function(resolve, reject) {
  setTimeout(function() {
    // resolve('test resolve')
    reject('test reject')
  }, 1000)
})
p.then((val) => {
  console.log(val)
  return val
}).then(val => {
  console.log(val)
})