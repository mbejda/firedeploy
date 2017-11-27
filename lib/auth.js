'use strict';
var _ = require('lodash');
var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');

var api = require('./api');

// in-memory cache, so we have it for successive calls
var lastAccessToken = {};

var _refreshAccessToken = function(refreshToken, authScopes) {
  return api.request('POST', '/oauth2/v3/token', {
    origin: api.googleOrigin,
    form: {
      refresh_token: refreshToken,
      client_id: api.clientId,
      client_secret: api.clientSecret,
      grant_type: 'refresh_token',
      scope: (authScopes || []).join(' ')
    }
  }).then(function(res) {
    if (!_.isString(res.body.access_token)) {
      throw new Error("Access token failed")
    }
    lastAccessToken = _.assign({
      expires_at: Date.now() + res.body.expires_in * 1000,
      refresh_token: refreshToken,
      scopes: authScopes
    }, res.body);


    return lastAccessToken;
  }, function(err) {
    if (_.get(err, 'context.body.error') === 'invalid_scope') {
      throw new Error("error, invalid scope")
    }

    throw new Error("Invalid Credentials");
  });
};

var getAccessToken = function(refreshToken, authScopes) {

  return _refreshAccessToken(refreshToken, authScopes);
};


var auth = {
  getAccessToken: getAccessToken
};

module.exports = auth;
