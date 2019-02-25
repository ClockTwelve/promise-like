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


function Thenation(promise, onFulfilled, onRejected, isExcuted = false) {
  this.excuted = isExcuted
  this.promise = promise
  this.onFulfilled = onFulfilled
  this.onRejected = onRejected
}

function doTask(promise, task) {
  let called = false
  try {
    task(function(val) {
      if(called) return
      called = true
      doResolve(promise, val)
    }, function(e) {
      if(called) return
      called = true
      doReject(promise, e)
    })
  } catch(e) {
    if(called) return
    called = true
    doReject(promise, e)
  }
}

function doResolve(ctx, val) {

  ctx.state = FULFILLED
  ctx.value = val
  ctx.queueThens.forEach(aThen => {
    aThen.excuted ? null : doThen(aThen.promise, aThen.onFulfilled, ctx)
  })
}
function doReject(ctx, e) {
  ctx.state = REJECTED
  ctx.value = e
  ctx.queueThens.forEach(aThen => {
    aThen.excuted ? null : doThen(aThen.promise, aThen.onRejected, ctx)
  })
}
function doResolutionProcedure(ctx, val, state) {
  if(ctx === val) {
    let error = new TypeError('Can\'t return promise itself in resolve')
    doReject(ctx, error)
    return
  }
  let doFn = state === FULFILLED ? doResolve : doReject
  try{
    if(val instanceof Promise) {
      if(val.state === PENDING) {
        val.then(val => {
          doResolve(ctx, val)
        }).catch(e => {
          doReject(ctx, e)
        })
      }
    }else if(isObj(val) || isFn(val)) {
      let then = val.then
      if(isFn(then)) {
        let called = false
        try {
          then.call(x, v => {
            if(called) return
            called = true
            doResolutionProcedure(ctx, v)
          },e => {
            if(called) return
            called = true
            doReject(ctx, e)
          })
        }catch(e) {
          if(called) e
          else doReject(ctx, e)
        }
      }else {
        doFn(ctx, val)
      }
    }else {
      doFn(ctx, val)
    }
  }catch (e) {
    doReject(ctx, e)
  }
}

function doThen(promise, cb, prevPromise) {

  nextTick(function() {
    if(!cb) {
      prevPromise.state === FULFILLED ? doResolve(promise, prevPromise.value) : doReject(promise, prevPromise.value)
    }else {
    let state, result
      try {
        result = cb.call(null, prevPromise.value)
        state = FULFILLED
      } catch(e){
        state = REJECTED
        result = e
      }
      doResolutionProcedure(promise, result, state)
    }
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