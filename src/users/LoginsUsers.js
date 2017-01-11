'use strict';

class LoginsUsers {
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
