/* global emit */
'use strict';

module.exports = {
  aliases: {
    map: String(function (doc) {
      const parts = doc._id.split(':');
      const type = parts[0];

      if (type === 'alias') {
        emit(doc.id, {
          _id: 'id:' + doc.id,
          public: doc.public,
          date: doc.date,
          type: parts[1],
          value: parts[2]
        });
      }
    })
  }
};

if (!module.parent)
  require('../utils').debugPrint(module.exports, {json: true});
