var Q = require("q"),
  FB = require('fb'),
  Phantom = require('./utils/phantom-promise'),
  Config = require('./config.json'),
  Utils = require('./utils/utils');

// Set the access token
FB.setAccessToken(Config.accessToken);

var phantom,
  page,
  numPokes = 0,
  numRetry = 0;

// Gets pokes via the Graph API and checks if the target has poked you
function haveBeenPoked() {
  var deferred = Q.defer();
  FB.api('/v2.1/me/pokes', function(res) {
    if (!res || res.error) {
      deferred.reject(res.error);
    } else {
      var result = [];
      var pokes = res.data;
      deferred.resolve(pokes.length > 0);
    }
  });
  return deferred.promise;
}

// Logs into Facebook
function facebookLogin() {
  return Phantom.openPage(page, 'https://www.facebook.com/login.php?next=https%3A%2F%2Fwww.facebook.com%2Fpokes')
    .then(function(status) {
      if (status === 'success') {
        console.log('Opened Facebook');
        console.log('Logging in');
        return Phantom.evaluatePage(page, function(args) {
          document.getElementById("email").value = args.email;
          document.getElementById("pass").value = args.password;
          document.getElementById("u_0_1").click();
        }, {
          "email": Config.email,
          "password": Config.password
        });
      }
    });
}

// Clicks the poke buttons
function clickPokeButtons() {
  var pokeExists = true;
  return Utils.promiseWhile(function() {
    return pokeExists;
  }, function() {
    return Phantom.evaluatePage(page, function() {
        return (document.querySelector("div[id^='poke_live_item_'] a.selected") !== null);
      })
      .then(function(exists) {
        pokeExists = exists;
        if(exists) {
          return Phantom.evaluatePage(page, function() {
            var pokeButton = document.querySelector("div[id^='poke_live_item_'] a.selected");
            var click = document.createEvent('Events');
            click.initEvent('click', true, false);
            pokeButton.dispatchEvent(click);
          })
          .then(function() {
            console.log('You poked someone');
          });
        }
      })
      .then(function() {
        return Q.delay(3000);
      })
  });
}

// Pokes the user with the given userId
function poke() {
  Phantom.phantomCreate()
    .then(function(ph) {
      console.log('Creating page');
      phantom = ph;
      return Phantom.createPage(phantom);
    })
    .then(function(pg) {
      page = pg;
      console.log('Opening login page');
      return facebookLogin();
    })
    .then(function() {
      return Q.delay(3000);
    })
    .then(function() {
      return clickPokeButtons();
    })
    .then(function() {
      return phantom.exit();
    })
    .catch(function(error) {
      console.log(error);
      phantom.exit();
    });
}

// Main loop
console.log('Starting Poke-War...');
Utils.promiseWhile(function() {
  return numRetry >= 0;
}, function() {
  console.log('Checking for pokes');
  return haveBeenPoked()
    .then(function(poked) {
      if (poked) {
        console.log("You have been poked!");
        return poke();
      }
    })
    .then(function() {
      return Q.delay(Config.interval);
    })
})
  .catch(function(error) {
    console.log(error);
  });
