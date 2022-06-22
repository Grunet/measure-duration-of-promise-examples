import { promiseHooks } from 'node:v8';

const stopWatchingInits = promiseHooks.onInit(function (promise) {
    promise.startInstant = performance.now();
});
const stopWatchingSettleds = promiseHooks.onSettled(function (promise) {
    //This logs a whole lot more than just the fetch promise. Like A LOT
    //The longest value it logs is around 310ms, which is probably closest to the duration of the http request
    console.log(performance.now() - promise.startInstant);
});

console.log("BEFORE");
await fetch("https://httpbin.org/get");
console.log("AFTER");