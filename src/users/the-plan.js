'use strict';

class FindsUsers {
  static byId (id, callback) {
    const docId = id;
    db.getDocument(docId, callback);
  }

  static byToken (token, callback) {
    const id = authdb.retrieve(token);
    FindsUsers.byId(id, callback);
  }

  static byAlias (value, type, callback) {
    const docId = `alias:${type}:${value}`;
    db.getDocument(docId);
  }
}



class ChangesPassword {
  static change (id, newPassword, callback) {
    const docId = id;
    db.getDocument(docId, doc => {
      doc.password = newPassword;
      db.replaceDocument(docId, doc);
    });
  }
}

class AddsAliases {
  static add (id, newAliases, callback) {
    const docs = createAliasesDocs(id, newAliases);
    db.saveDocuments(docs);
  }
}

module.exports = CreatesUsers;
