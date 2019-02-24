import nextTick from './nextTick'

'use strict'

const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function _empty() {}

function isFn(arg) {
  return Object.prototype.toString.call(arg) === '[object Function]'
}
function isObj(arg) {
  return Object.prototype.toString.call(arg) === '[object Object]'
}


function Thenation(promise, onFulfilled, onRejected, isExcute = false) {
  this.excute = isExcute
  this.promise = promise
  this.onFulfilled = onFulfilled
  this.onRejected = onRejected
}

function doTask(promise, task) {
  let called = false
  try {
    task(function(val) {
      if(called) return
      doResolve(promise, val)
      called = true
    }, function(e) {
      if(called) return
      doReject(promise, e)
      called = true
    })
  } catch(e) {
    if(called) return
    doReject(promise, e)
    called = true
  }
}

function doResolve(ctx, val) {
  ctx.state = FULFILLED
  ctx.value = val
  ctx.queueThens.forEach(aThen => {
    aThen.excute ? null : doThen(aThen.promise, aThen.onFulfilled, ctx)
  })
}
function doReject(ctx, e) {
  ctx.state = REJECTED
  ctx.value = e
  ctx.queueThens.forEach(aThen => {
    aThen.excute ? null : doThen(aThen.promise, aThen.onRejected, ctx)
  })
}
function doResolutionProcedure(ctx, val) {
  if(ctx === val) {
    let error = new TypeError('Can\'t return promise itself in resolve')
    doReject(ctx, error)
    return
  }
  try{
    if(val instanceof Promise) {

    }else if(isObj(val) || isFn(val)) {
      
    }else {
      doResolve(ctx, val)
    }
  }catch (e) {
    doReject(ctx, e)
  }
}

function doThen(promise, cb, prevPromise) {
  if(!cb) {
    promise.state = prevPromise.state
    promise.value = prevPromise.value
    return
  }
  nextTick(function() {
    let result = cb.call(null, prevPromise.value)
    doResolutionProcedure(promise, result)
  })
}

function Promise(task) {
  this.state = PENDING
  this.queueThens = []
  this.value = void 0
  if(task !== _empty) {
    doTask(this, task)
  }
}

Promise.prototype.then = function(onFulfilled, onRejected) {
  let promise = new Promise(_empty)
  if(this.state !== PENDING) {
    let cb = this.state === FULFILLED ? onFulfilled : onRejected
    doThen(promise, cb, this)
  } else {
    this.queueThens.push(new Thenation(promise, onFulfilled, onRejected))
  }
  return promise
}

Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected)
}


export default Promise