var Q = require("q");

function promiseWhile(condition, body) {
  var deferred = Q.defer();

  function loop() {
    if (!condition()) return deferred.resolve();
    Q.when(body(), loop, deferred.reject);
  }
  Q.nextTick(loop);
  return deferred.promise;
}

exports.promiseWhile = promiseWhile
