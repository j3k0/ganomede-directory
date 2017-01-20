'use strict';

class LoginsUsers {
  // TODO:
  // interesting, feels pretty wierd, error-prone, maybe look into better arch…).
  constructor (db, authdb) {
    this.db = db;
    this.authdb = authdb;
  }

  // callback(err, hashString)
  hashPassword (password, callback) {
    throw new Error('NotImplemented');
  }

  createToken (userId, callback) {
    throw new Error('NotImplemented');
  }

  // callback(err, authtoken)
  login (userId, password, callback) {
    throw new Error('NotImplemented');
    // const docId = id;
    // db.getDocument(docId, ({hash}) => {
    //   pbkdf.verify(password, hash, callback);
    // });
  }
}

module.exports = LoginsUsers;
