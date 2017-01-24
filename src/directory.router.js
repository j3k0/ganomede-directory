'use strict';

const restify = require('restify');
const {sendHttpError} = require('./errors');
const FindsProfiles = require('./users/FindsProfiles');
const LoginsUsers = require('./users/LoginsUsers');
const CreatesUsers = require('./users/CreatesUsers');
const ChangesPasswords = require('./users/ChangesPasswords');

const nonemptyString = str => (typeof str === 'string') && (str.length > 0);
const validateUserId = nonemptyString;
const validatePassword = pwd => nonemptyString(pwd) && (pwd.length >= 8);
const validateAlias = alias => (typeof alias === 'object') && (!!alias)
  && nonemptyString(alias.type) && nonemptyString(alias.value)
  && (!alias.hasOwnProperty('public') || (typeof alias.public === 'boolean'));
const validateAliases = aliases => Array.isArray(aliases) && aliases.every(validateAlias);

const badUserId = next => sendHttpError(next, new restify.BadRequestError('Invalid User ID'));
const badPassword = next => sendHttpError(next, new restify.BadRequestError('Password must be at least 8 characters long'));
const badAliases = next => sendHttpError(next, new restify.BadRequestError('Some of the aliases are invalid'));

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

  const createUser = (req, res, next) => {
    const {id, password, aliases} = req.body;

    if (!validateUserId(id))
      return badUserId(next);

    if (!validatePassword(password))
      return badPassword(next);

    if (!validateAliases(aliases))
      return badAliases(aliases);

    createsUsers.create(id, password, aliases, (err, json) => {
      return err
        ? sendHttpError(next, err)
        : res.json(json);
    });
  };

  const changePassword = (userId, newPassword, res, next) => {
    if (!validatePassword(newPassword))
      return badPassword(next);

    changesPasswords.change(userId, newPassword, (err) => {
      return err
        ? sendHttpError(next, err)
        : res.status(200).end();
    });
  };

  const addAliases = (userId, aliases, res, next) => {
    if (!validateAliases(aliases))
      return badAliases(next);

    // TODO
    // implement this
    next(new restify.NotImplementedError());
  };

  const editUser = (req, res, next) => {
    const {userId} = req.params;

    if (!validateUserId(userId))
      return badUserId(next);

    if (req.body) {
      if (req.body.hasOwnProperty('password'))
        return changePassword(userId, req.body.password, res, next);

      if (req.body.hasOwnProperty('aliases'))
        return addAliases(userId, req.body.aliases, res, next);
    }

    sendHttpError(next, new restify.BadRequestError());
  };

  const sendProfileBack = (includePrivateDate, res, next) => (err, profile) => {
    return err
      ? sendHttpError(next, err)
      : res.json(includePrivateDate ? profile.private() : profile.public());
  };

  const lookupWithUserId = (req, res, next) => {
    const {userId} = req.params;
    return userId
      ? findsProfiles.byUserId(userId, sendProfileBack(req.ganomede.secretMatches, res, next))
      : sendHttpError(next, new restify.BadRequestError());
  };

  const lookupWithToken = (req, res, next) => {
    const {token} = req.params;
    return token
      ? findsProfiles.byAuthToken(token, sendProfileBack(true, res, next))
      : sendHttpError(next, new restify.BadRequestError());
  };

  const lookupWithAlias = (req, res, next) => {
    const {type, value} = req.params;
    return (type && value)
      ? findsProfiles.byAlias(type, value, sendProfileBack(req.ganomede.secretMatches, res, next))
      : sendHttpError(next, new restify.BadRequestError());
  };

  const loginUser = (req, res, next) => {
    const {id, password} = req.body;

    if (!id || !password)
      return sendHttpError(next, new restify.BadRequestError());

    loginsUsers.login(id, password, (err, token) => {
      return err
        ? sendHttpError(next, err)
        : res.json({id, token});
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
