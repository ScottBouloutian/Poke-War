var Phantom = require('phantom'),
  Q = require("q");

function phantomCreate() {
  var deferred = Q.defer();
  Phantom.create(function(phantom) {
    deferred.resolve(phantom);
  });
  return deferred.promise;
}

function createPage(phantom) {
  var deferred = Q.defer();
  phantom.createPage(function(page) {
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

exports.phantomCreate = phantomCreate;
exports.createPage = createPage;
exports.openPage = openPage;
exports.evaluatePage = evaluatePage;
