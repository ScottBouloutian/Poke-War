var Q = require("q"),
    Phantom = require('phantom'),
    Config = require('./config.json');

var phantom,
    page,
    numPokes=0,
    numRetry=0;

phantomCreate()
  .then(function(ph) {
    console.log('Creating page');
    phantom = ph;
    return createPage(phantom);
  })
  .then(function(pg) {
    console.log('Opening login page');
    page = pg;
    return openPage(page, 'https://www.facebook.com/login.php?next=https%3A%2F%2Fwww.facebook.com%2Fpokes');
  })
  .then(function(status) {
    if(status === 'success') {
      console.log('Opened Facebook');
    }
    console.log('Logging in');
    return evaluatePage(page, function(args) {
      document.getElementById("email").value = args.email;
      document.getElementById("pass").value = args.password;
      document.getElementById("u_0_1").click();
    }, { "email": Config.email, "password": Config.password } );
  })
  .then(function() {
    return Q.delay(3000);
  })
  .then(function() {
    return checkForPokes();
  })
  .then(function() {
    return promiseWhile(function() { return numRetry<999 }, checkForPokes);
  })
  .then(function() {
    return phantom.exit();
  })
  .catch(function(error) {
    console.log(error);
    phantom.exit();
  });

function checkForPokes() {
  return evaluatePage(page, function() {
    return (document.querySelector("div #poke_live_item_100000716433300")!==null);
  })
  .then(function(exists) {
    if(exists) {
      console.log("I poked you!");
      numPokes++;
      return evaluatePage(page, function() {
        var poke = document.querySelector("div #poke_live_item_100000716433300 a._42ft");
        var evObj = document.createEvent('Events');
        evObj.initEvent('click', true, false);
        poke.dispatchEvent(evObj);
      });
    } else {
      return;
    }
  })
  .then(function() {
    return evaluatePage(page, function() {
      return location.reload();
    });
  })
  .then(function() {
    console.log('retry', numRetry++, 'pokes', numPokes);
    return Q.delay(10000);
  });
}

function phantomCreate() {
  var deferred = Q.defer();
  Phantom.create(function(phantom) {
    deferred.resolve(phantom);
  });
  return deferred.promise;
}

function createPage(phantom) {
  var deferred = Q.defer();
  phantom.createPage(function(page){
    deferred.resolve(page);
  });
  return deferred.promise;
}

function openPage(page, url) {
  var deferred = Q.defer();
  page.open(url, function(status) {
    deferred.resolve(status);
  });
  return deferred.promise;
}

function evaluatePage(page, script, arguments) {
  var deferred = Q.defer();
  page.evaluate(script, function(result) {
    deferred.resolve(result);
  }, arguments);
  return deferred.promise;
}

function promiseWhile(condition, body) {
    var deferred = Q.defer();
    function loop() {
        if (!condition()) return deferred.resolve();
        Q.when(body(), loop, deferred.reject);
    }
    Q.nextTick(loop);
    return deferred.promise;
}
