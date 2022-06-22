//Requires Node 18
//Run this with
// node --experimental-fetch asynchooksAndAsyncLocalStorage.mjs
import async_hooks from 'async_hooks';
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

// Return the ID of the current execution context.
// const eid = async_hooks.executionAsyncId();

// Return the ID of the handle responsible for triggering the callback of the
// current execution scope to call.
// const tid = async_hooks.triggerAsyncId();

// Create a new AsyncHook instance. All of these callbacks are optional.
const asyncHook =
    async_hooks.createHook({ init, before, after, destroy, promiseResolve });

// Allow callbacks of this AsyncHook instance to call. This is not an implicit
// action after running the constructor, and must be explicitly run to begin
// executing callbacks.
asyncHook.enable();

asyncLocalStorage.run(new Map(), async () => {
    globalThis.blah = asyncLocalStorage.getStore();

    return await Promise.resolve().then(() => {
        console.log(performance.now())
        return fetch("https://httpbin.org/get").then(() => { console.log(performance.now()) });
    })
});

// Disable listening for new asynchronous events.
asyncHook.disable();

setTimeout(() => {
    console.log(globalThis.blah);
}, 1000);

//
// The following are the callbacks that can be passed to createHook().
//

// init is called during object construction. The resource may not have
// completed construction when this callback runs, therefore all fields of the
// resource referenced by "asyncId" may not have been populated.
function init(asyncId, type, triggerAsyncId, resource) {
    // if (type !== "PROMISE") {
    //     return;
    // }

    const asyncIdToTimestampsMap = asyncLocalStorage.getStore();
    asyncIdToTimestampsMap.set(asyncId, { startInstant: performance.now() });
}

// Before is called just before the resource's callback is called. It can be
// called 0-N times for handles (such as TCPWrap), and will be called exactly 1
// time for requests (such as FSReqCallback).
function before(asyncId) {

    //From the doc page
    // ther subtlety with promises is that before and after callbacks are run only on chained promises. That means promises not created by then()/catch() will not have the before and after callbacks fired on them. For more details see the details of the V8 PromiseHooks API.
    //Which is why the random Promise.resolve is needed
}

// After is called just after the resource's callback has finished.
function after(asyncId) {
    //This never seems to get hit with the "await fetch" example 
}

// Destroy is called when the resource is destroyed.
function destroy(asyncId) {
}

// promiseResolve is called only for promise resources, when the
// `resolve` function passed to the `Promise` constructor is invoked
// (either directly or through other means of resolving a promise).
function promiseResolve(asyncId) {
    // console.log("Whaaa?"); //This should blow up the callstack per https://nodejs.org/api/async_hooks.html#printing-in-asynchook-callbacks but nothing is happening...
    const asyncIdToTimestampsMap = asyncLocalStorage.getStore();
    // const startInstant = asyncIdToTimestampsMap.get(asyncId)?.startInstant;
    // console.log(performance.now() - startInstant);
    if (asyncIdToTimestampsMap.get(asyncId)) {
        asyncIdToTimestampsMap.get(asyncId).endInstant = performance.now(); //The numbers this is generating say the fetch is taking 3ms, which seems wrong...unless that's a different promise
    }
}