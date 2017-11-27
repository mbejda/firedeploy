'use strict';
var _ = require('lodash');
var request = require('request');
var scopes = require('./scopes');

var CLI_VERSION = require('../package.json').version;

var refreshToken;
var commandScopes;

var _request = function(options,debug) {


  return new Promise(function(resolve, reject) {
    var req = request(options, function(err, response, body) {
      if (err) {
        return reject(new Error('Server Error. ' + err.message));
      }
      if(debug) {
          console.log('<<< HTTP RESPONSE', response.statusCode, response.headers);

          if (response.statusCode >= 400) {
              console.log('<<< HTTP RESPONSE BODY', response.body);
              return reject(new Error(response.body.error.message));

          }
      }

      return resolve({
        status: response.statusCode,
        response: response,
        body: body
      });
    });

    if (_.size(options.files) > 0) {
      var form = req.form();
      _.forEach(options.files, function(details, param) {
        form.append(param, details.stream, {
          knownLength: details.knownLength,
          filename: details.filename,
          contentType: details.contentType
        });
      });
    }
  });
};



var api = {
  // "In this context, the client secret is obviously not treated as a secret"
  // https://developers.google.com/identity/protocols/OAuth2InstalledApp
  clientId: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
  clientSecret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
  hostingOrigin: 'https://firebaseapp.com',
    deployOrigin: 'https://deploy.firebase.com',
    realtimeOrigin:'https://firebaseio.com',
    runtimeconfigOrigin: 'https://runtimeconfig.googleapis.com',
    googleOrigin: 'https://www.googleapis.com',


  setRefreshToken: function(token) {
    refreshToken = token;
  },

  addRequestHeaders: function(reqOptions) {

      commandScopes = _.uniq(_.flatten([
          scopes.EMAIL,
          scopes.OPENID,
          scopes.CLOUD_PROJECTS_READONLY,
          scopes.FIREBASE_PLATFORM
      ].concat([])));



        // Runtime fetch of Auth singleton to prevent circular module dependencies
        _.set(reqOptions, ['headers', 'User-Agent'], 'FireDeployCLI/' + CLI_VERSION);
        _.set(reqOptions, ['headers', 'X-Client-Version'], 'FireDeployCLI/' + CLI_VERSION);

      var auth = require('./auth');
      return auth.getAccessToken(refreshToken, commandScopes).then(function(result) {
          _.set(reqOptions, 'headers.authorization', 'Bearer ' + result.access_token);
          return reqOptions;
      });


  },
  request: function(method, resource, options) {
    options = _.extend({
      data: {},
      origin: 'https://admin.firebase.com', // default to hitting the admin backend
      resolveOnHTTPError: false, // by default, status codes >= 400 leads to reject
      json: true
    }, options);

    var validMethods = ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'];

    if (validMethods.indexOf(method) < 0) {
      method = 'GET';
    }

    var reqOptions = {
      method: method
    };



      if (_.size(options.data) > 0) {
        reqOptions.body = options.data;
      } else if (_.size(options.form) > 0) {
        reqOptions.form = options.form;
      }


    reqOptions.url = options.origin + resource;
    reqOptions.files = options.files;
    reqOptions.json = options.json;

    if (options.auth === true) {
      return api.addRequestHeaders(reqOptions).then(function(reqOptionsWithToken) {
        return _request(reqOptionsWithToken,options.debug);
      });
    }

    return _request(reqOptions,options.debug);
  }
};

module.exports = api;
