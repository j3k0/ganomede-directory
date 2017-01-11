'use strict';

const async = require('async');
const LoginsUsers = require('./LoginsUsers');
const DB = require('../db/db');
const config = require('../../config');

// callback(err, docId, docBody)
const createUserDoc = (id, password, callback) => {
  new LoginsUsers().hashPassword(password, (err, hash) => {
    if (err)
      return callback(err);

    callback(null, {id, hash});
  });
};

// callback(err, docId2docBodyMap)
const createAliasesDocs = (id, aliases, creationDate, callback) => {
  const docs = {};

  aliases.forEach(alias => {
    const docId = `alias:${alias.type}:${alias.value}`;
    const docBody = {
      id,
      date: creationDate,
      public: alias.public === true
    };

    docs[docId] = docBody;
  });

  setImmediate(callback, null, docs);
};

class CreatesUsers {
  create (id, password, aliases, creationDate, callback) {
    const db = new DB(config.couch);

    async.parallel({
      userDoc: (cb) => createUserDoc(id, password, cb),
      aliasesDocs: (cb) => createAliasesDocs(id, aliases, creationDate, cb)
    }, (err, {userDoc, aliasesDocs} = {}) => {
      if (err)
        return callback(err);

      // TODO:
      // must check all the docs are inserted
      // must know that no aliases are 409
      async.parallel([
        (cb) => db.save(`id:${id}`, userDoc, cb),
        (cb) => db.saveMulti(aliasesDocs, cb)
      ], (err) => {
        if (err)
          return callback(err);

        new LoginsUsers().createToken(id, (err, token) => {
          return err
            ? callback(err)
            : callback(null, {id, token});
        });
      });
    });
  }
}

module.exports = CreatesUsers;
