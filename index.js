var Q = require("q"),
  FB = require('fb'),
  Phantom = require('./utils/phantom-promise'),
  Config = require('./secrets.json'),
  Utils = require('./utils/utils'),
  https = require('https'),
  winston = require('winston'),
  Datastore = require('nedb');

// Set reasonable defaults
var shortInterval = Config.shortInterval || 15000,
  longInterval = Config.longInterval || 300000,
  activeAttempts = Config.activeAttempts || 3;

// Setup the logger
winston.add(winston.transports.File, {
  filename: 'poke_history.log'
});

// Setup the database
var db = {};
db.users = new Datastore({
  filename: './users.db',
  autoload: true
});
db.pokes = new Datastore({
  filename: './pokes.db',
  autoload: true
});

// Set the access token
FB.setAccessToken(Config.accessToken);

var phantom,
  page,
  numPokes = 0,
  numRetry = 0;

// Queries the Facebook's Graph API to see if anyone has poked you
function haveBeenPoked() {
  return Q.npost(FB, 'napi', ['/v2.1/me/pokes'])
    .then(function(res) {
      if (!res || res.error) {
        return Q.reject(res.error);
      } else {
        var pokes = res.data;
        return Q(pokes.length > 0);
      }
    });
}

// Logs into Facebook and redirects to the pokes page
function facebookLogin() {
  return Phantom.openPage(page, 'https://www.facebook.com/login.php?next=https%3A%2F%2Fwww.facebook.com%2Fpokes')
    .then(function(status) {
      if (status === 'success') {
        console.log('Logging in...');
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

// Clicks all 'Poke Back' buttons on the current page
function clickPokeButtons() {
  var pokeExists = true;
  var continueLoop = true;
  var numRetry = 0;
  return Utils.promiseWhile(function() {
    return continueLoop;
  }, function() {
    return Phantom.evaluatePage(page, function() {
        return (document.querySelector("div[id^='poke_live_item_'] a.selected") !== null);
      })
      .then(function(exists) {
        pokeExists = exists;
        if (exists) {
          return Phantom.evaluatePage(page, function() {
            var pokeButton = document.querySelector("div[id^='poke_live_item_'] a.selected");
            var pokeItem = pokeButton.parentNode.parentNode.parentNode;
            var pokeTarget = pokeItem.querySelector("div._6a._42us a").innerHTML;
            var click = document.createEvent('Events');
            click.initEvent('click', true, false);
            pokeButton.dispatchEvent(click);
            return pokeTarget;
          });
        }
      })
      .then(function(pokeTarget) {
        if (pokeExists) {
          winston.log('info', 'You poked ' + pokeTarget + '.');

          // Ensure poke target is in the users collection
          Q.npost(db.users, 'find', [{
            name: pokeTarget
          }])
            .then(function(docs) {
              if (docs.length === 0) {
                return Q.npost(db.users, 'insert', [{
                  name: pokeTarget
                }]);
              }
            });

          // Add this poke to the pokes collection
          db.pokes.insert({
            name: pokeTarget,
            date: new Date()
          });

          numRetry = 0;
          return Q.delay(3000);
        } else if (numRetry < activeAttempts) {
          console.log('Attempt ' + numRetry + ': No pending pokes. Waiting ' + shortInterval / 1000 + " seconds...");
          numRetry++;
          page.reload();
          return Q.delay(shortInterval);
        } else {
          console.log('Hibernating...');
          continueLoop = false;
        }
      });
  });
}

// Logs into Facebook and starts actively poking back friends
function startActivelyPoking() {
  Phantom.phantomCreate()
    .then(function(ph) {
      phantom = ph;
      return Phantom.createPage(phantom);
    })
    .then(function(pg) {
      page = pg;
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

// This is the main loop
console.log('Starting Poke-War');
Utils.promiseWhile(function() {
  return numRetry >= 0;
}, function() {
  console.log('Checking for pokes...');
  return haveBeenPoked()
    .then(function(poked) {
      if (poked) {
        console.log("You have been poked! Seeking revenge...");
        return startActivelyPoking();
      } else {
        console.log('No pokes found. Waiting ' + longInterval / 1000 + ' seconds...');
      }
    })
    .then(function() {
      return Q.delay(longInterval);
    })
})
  .catch(function(error) {
    console.log('There has been an error');
    console.log(error);
  });
