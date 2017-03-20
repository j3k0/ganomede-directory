//
// Talks to directory server
//
//
//
// DirectoryAccount: {
//   "id": string
//   aliases: {
//     "<type>": "<value>"
//     ...
//   }
//
// example DirectoryAccount:
// {"id":"aaa","aliases":{"email":"user@email.com","name":"aaa","tag":"aaa"}}
//

var restify = require('restify');
var bunyan = require('bunyan');
var url = require('url');

var clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

const ENV_PREFIX = 'DIRECTORY_PORT_8000_TCP_';
const env = (suffix, defaultValue) =>
  (process.env[ENV_PREFIX + suffix] || defaultValue);

const createJsonClient = (args) =>
  restify.createJsonClient({
    url: url.format({
      protocol: args.protocol || env('PROTOCOL', 'http'),
      hostname: args.host || env('ADDR', '127.0.0.1'),
      port:     +(args.port || env('PORT', 8000)),
      pathname: 'directory/v1'
    })
  });

var createClient = function(params) {

  params = params || {};
  var jsonClient = params.jsonClient || createJsonClient(params);
  var log = params.log || bunyan.createLogger({
    name: 'directory-client',
    level: process.env.LOG_LEVEL || 'info'
  });

  var apiSecret = params.apiSecret || process.env.API_SECRET;

  if (!jsonClient) {
    throw new Error('jsonClient required');
  }

  var jsonPost = function(options, reqBody, cb) {
    jsonClient.post(options, reqBody, function(err, req, res, resBody) {
      var req_id;
      if (options.headers && options.headers['x-request-id'])
        req_id = options.headers['x-request-id'];
      log.debug({
        options: options,
        reqBody: reqBody,
        req_id: options.headers && options.headers['x-request-id'],
        resErr: err,
        resBody: resBody
      }, "directoryClient.post");
      cb(err, req, res, resBody);
    });
  };

  var jsonGet = function(options, cb) {
    jsonClient.get(options, function(err, req, res, body) {
      log.debug({
        options: options,
        req_id: options.headers && options.headers['x-request-id'],
        resErr: err,
        resBody: body
      }, "directoryClient.get");
      cb(err, req, res, body);
    });
  };

  var pathname = (jsonClient.url && jsonClient.url.pathname) || '';
  log.debug({pathname: pathname}, "directoryClient created");

  var endpoint = function(subpath) {
    return pathname + (subpath || '');
  };

  var jsonOptions = function(args) {
    var options = {
      path: endpoint(args.path)
    };
    if (args.req_id) {
      options.headers = {
        "x-request-id": args.req_id
      };
    }
    return options;
  };

  var authenticate = function(credentials, callback) {

    var options = jsonOptions({
      path: '/users/auth',
      req_id: credentials.req_id
    });

    var body = {
      id: credentials.id,
      password: credentials.password
    };
    if (credentials.token)
      body.token = credentials.token;

    jsonPost(options, body, function(err, req, res, body) {
      if (err && err.restCode === 'UserNotFoundError') {
        log.info({
          req_id: credentials.req_id,
          id: credentials.id,
          code: 'UserNotFoundError'
        }, "failed to authenticate");
        callback(err);
      }
      else if (res && res.statusCode === 401) {
        callback(new restify.InvalidCredentialsError());
      }
      else if (err) {
        log.error({req_id: credentials.req_id, err: err},
          "authentication error");
        callback(err);
      }
      else if (res && res.statusCode !== 200) {
        log.error({req_id: credentials.req_id, code: res.statusCode},
          "failed to authenticate");
        callback(new Error("HTTP" + res.statusCode));
      }
      else {
        callback(null, body);
      }
    });
  };

  var addAccount = function(account, callback) {

    account = account || {};
    if (!account.id || !account.password)
      return callback(new restify.InvalidContentError('Missing credentials'));

    var options = jsonOptions({
      path: '/users',
      req_id: account.req_id
    });
    var body = {
      secret: apiSecret,
      id: account.id,
      password: account.password,
      aliases: account.aliases
    };

    postAccount('create', options, body, callback);
  };

  var editAccount = function(account, callback) {

    account = account || {};
    if (!account.id)
      return callback(new restify.InvalidContentError('Missing account id'));

    var options = jsonOptions({
      path: "/users/id/" + account.id,
      req_id: account.req_id
    });

    var body = {secret: apiSecret};

    if (account.password)
      body.password = account.password;
    else if (account.aliases && account.aliases.length)
      body.aliases = account.aliases;
    else
      return callback(new restify.InvalidContentError('Nothing to change'));

    postAccount("edit", options, body, callback);
  };

  var postAccount = function(description, options, body, callback) {
    jsonPost(options, body, function(err, req, res, body) {
      if (err) {
        callback(err);
      }
      else if (res.statusCode !== 200) {
        log.error({code: res.statusCode},
          "failed to " + description + " account");
        callback(new Error("HTTP" + res.statusCode));
      }
      else if (!body) {
        callback(new restify.InvalidContentError('Server replied with no data'));
      } else {
        callback(null, body);
      }
    });
  };

  var processGetResponse = function(callback) {
    return function(err, req, res, body) {
      if (err)
        callback(err);
      else if (res.statusCode !== 200)
        callback(new Error("HTTP" + res.statusCode));
      else if (!body)
        callback(new restify.InvalidContentError('Server replied with no data'));
      else
        callback(null, body);
    };
  };

  // callback(err, DirectoryAccount)
  var byAlias = function(params, callback) {
    var options = jsonOptions({
      path: "/users/alias/" + params.type + "/" + params.value,
      req_id: params.req_id
    });
    jsonGet(options, processGetResponse(callback));
  };

  // callback(err, DirectoryAccount)
  var byToken = function(params, callback) {
    var options = jsonOptions({
      path: "/users/auth/" + params.token,
      req_id: params.req_id
    });
    jsonGet(options, processGetResponse(callback));
  };

  // callback(err, DirectoryAccount)
  var byId = function(params, callback) {
    var options = jsonOptions({
      path: "/users/id/" + params.id,
      req_id: params.req_id
    });
    jsonGet(options, processGetResponse(callback));
  };

  return {
    endpoint: endpoint,
    authenticate: authenticate,
    addAccount: addAccount,
    byId: byId,
    byAlias: byAlias,
    byToken: byToken,
    editAccount: editAccount
  };
};

module.exports = {
  createClient: createClient
};
