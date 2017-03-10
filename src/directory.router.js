'use strict';

const restify = require('restify');
const {RequestValidationError, sendHttpError, InvalidAuthTokenError} = require('./errors');
const FindsProfiles = require('./users/FindsProfiles');
const LoginsUsers = require('./users/LoginsUsers');
const CreatesUsers = require('./users/CreatesUsers');
const ChangesPasswords = require('./users/ChangesPasswords');
const AddsAliases = require('./users/AddsAliases');

const nonemptyString = str => (typeof str === 'string') && (str.length > 0);
const validateUserId = nonemptyString;
const validatePassword = pwd => nonemptyString(pwd) && (pwd.length >= 8);
const validateAlias = alias => (typeof alias === 'object') && (!!alias)
  && nonemptyString(alias.type) && nonemptyString(alias.value)
  && (!alias.hasOwnProperty('public') || (typeof alias.public === 'boolean'));
const validateAliases = aliases => Array.isArray(aliases) && (aliases.length > 0) && aliases.every(validateAlias);

const badUserId = next => sendHttpError(next, new RequestValidationError('BadUserId', 'Invalid User ID'));
const badPassword = next => sendHttpError(next, new RequestValidationError('BadPassword', 'Password missing or too short (must be at least 8 characters long)'));
const badAliases = next => sendHttpError(next, new RequestValidationError('BadAliases', 'Some of the aliases are invalid'));
const badAlias = next => sendHttpError(next, new RequestValidationError('BadAlias', 'Invalid alias format, include type and value'));

const requireSecret = (req, res, next) => {
  return req.ganomede.secretMatches
    ? next()
    : sendHttpError(next, new restify.NotAuthorizedError());
};

module.exports = ({db, authdb, prefix, server}) => {
  const findsProfiles = new FindsProfiles(db, authdb);
  const loginsUsers = new LoginsUsers(db, authdb);
  const createsUsers = new CreatesUsers(db, authdb);
  const changesPasswords = new ChangesPasswords(db);
  const addsAliases = new AddsAliases(db);

  const createUser = (req, res, next) => {
    const {id, password, aliases} = req.body;

    if (!validateUserId(id))
      return badUserId(next);

    if (!validatePassword(password))
      return badPassword(next);

    if (!validateAliases(aliases))
      return badAliases(next);

    createsUsers.create(id, password, aliases, (err, json) => {
      if (err)
        return sendHttpError(next, err);
      res.json(json);
      next();
    });
  };

  const changePassword = (userId, newPassword, res, next) => {
    if (!validatePassword(newPassword))
      return badPassword(next);

    changesPasswords.change(userId, newPassword, (err) => {
      if (err)
        return sendHttpError(next, err);
      res.send(200, '');
      next();
    });
  };

  const addAliases = (userId, aliases, res, next) => {
    if (!validateAliases(aliases))
      return badAliases(next);

    addsAliases.add(userId, aliases, (err) => {
      if (err)
        return sendHttpError(next, err);
      res.send(200, '');
      next();
    });
  };

  const editUser = (req, res, next) => {
    const {userId} = req.params;

    if (!validateUserId(userId))
      return badUserId(next);

    if (req.body) {
      const hasPassword = req.body.hasOwnProperty('password');
      const hasAliases = req.body.hasOwnProperty('aliases');
      const hasSingleMethod = !(hasPassword && hasAliases); // no bool xor in js, huh…

      if (hasSingleMethod && hasPassword)
        return changePassword(userId, req.body.password, res, next);

      if (hasSingleMethod && hasAliases)
        return addAliases(userId, req.body.aliases, res, next);
    }

    sendHttpError(next, new RequestValidationError('BadEditMethod', 'Not sure what to do, please include either new password, or aliases to add'));
  };

  const sendProfileBack = (includePrivateDate, res, next) => (err, profile) => {
    if (err)
      return sendHttpError(next, err);
    res.json(includePrivateDate ? profile.private() : profile.public());
    next();
  };

  const lookupWithUserId = (req, res, next) => {
    const {userId} = req.params;
    return userId
      ? findsProfiles.byUserId(userId, sendProfileBack(req.ganomede.secretMatches, res, next))
      : badUserId(next);
  };

  const lookupWithToken = (req, res, next) => {
    const {token} = req.params;
    return token
      ? findsProfiles.byAuthToken(token, sendProfileBack(true, res, next))
      : sendHttpError(next, new InvalidAuthTokenError());
  };

  const lookupWithAlias = (req, res, next) => {
    const {type, value} = req.params;
    return (type && value)
      ? findsProfiles.byAlias(type, value, sendProfileBack(req.ganomede.secretMatches, res, next))
      : badAlias(next);
  };

  const loginUser = (req, res, next) => {
    const {id, token, password} = req.body;

    if (!id)
      return badUserId(next);

    if (!password)
      return badPassword(next);

    loginsUsers.login(id, password, token, (err, token) => {
      if (err)
        return sendHttpError(next, err);
      res.json({id, token});
      next();
    });
  };

  // Validate secret here.
  server.post(`${prefix}/users`, requireSecret, createUser);
  server.post(`${prefix}/users/id/:userId`, requireSecret, editUser);

  server.get(`${prefix}/users/id/:userId`, lookupWithUserId);
  server.get(`${prefix}/users/auth/:token`, lookupWithToken);
  server.get(`${prefix}/users/alias/:type/:value`, lookupWithAlias);

  server.post(`${prefix}/users/auth`, loginUser);
};
