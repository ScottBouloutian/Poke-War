var FB = require('fb'),
  Step = require('step'),
  Q = require('q'),
  Datastore = require('nedb'),
  config = require('../config');

FB.options({
  appId: config.facebook.appId,
  appSecret: config.facebook.appSecret,
  redirectUri: config.facebook.redirectUri
});

exports.index = function(req, res) {
  var accessToken = req.session.access_token;
  if (!accessToken) {
    res.render('index', {
      title: 'Express',
      loginUrl: FB.getLoginUrl({
        scope: 'read_mailbox'
      })
    });
  } else {
    console.log('Access token successfully retrieved');
    res.render('success', {
      accessToken: accessToken
    });
  }
};

exports.loginCallback = function(req, res, next) {
  var code = req.query.code;

  if (req.query.error) {
    // user might have disallowed the app
    return res.send('login-error ' + req.query.error_description);
  } else if (!code) {
    return res.redirect('/');
  }

  Step(
    function exchangeCodeForAccessToken() {
      FB.napi('oauth/access_token', {
        client_id: FB.options('appId'),
        client_secret: FB.options('appSecret'),
        redirect_uri: FB.options('redirectUri'),
        code: code
      }, this);
    },
    function extendAccessToken(err, result) {
      if (err) throw (err);
      FB.napi('oauth/access_token', {
        client_id: FB.options('appId'),
        client_secret: FB.options('appSecret'),
        grant_type: 'fb_exchange_token',
        fb_exchange_token: result.access_token
      }, this);
    },
    function(err, result) {
      if (err) return next(err);

      req.session.access_token = result.access_token;
      req.session.expires = result.expires || 0;

      if (req.query.state) {
        var parameters = JSON.parse(req.query.state);
        parameters.access_token = req.session.access_token;

        console.log(parameters);

        FB.api('/me/' + config.facebook.appNamespace + ':eat', 'post', parameters, function(result) {
          console.log(result);
          if (!result || result.error) {
            return res.send(500, result || 'error');
            // return res.send(500, 'error');
          }

          return res.redirect('/');
        });
      } else {
        return res.redirect('/');
      }
    }
  );
};

exports.logout = function(req, res) {
  req.session = null; // clear session
  res.redirect('/');
};

exports.viewData = function(req, res) {

  // Load the database
  var db = {};
  db.users = new Datastore({
    filename: './users.db',
    autoload: true
  });
  db.pokes = new Datastore({
    filename: './pokes.db',
    autoload: true
  });

  var data = [];
  Q.npost(db.users, 'find', [{}, {
    name: 1
  }])
    .then(function(docs) {
      return Q.all(docs.map(function(doc) {
        return Q.npost(db.pokes, 'count', [{
            name: doc.name
          }])
          .then(function(count) {
            return {
              name: doc.name,
              numPokes: count
            }
          });
      }));
    })
    .then(function(result) {
      res.render('data', {
        data: result
      });
    });
};
