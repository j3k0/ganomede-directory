/* global emit:false getRow:false send:false */
'use strict';

module.exports = {
  views: {
    // Basically, this emits all the docs we have on user,
    // then list function aggregates them into profile object.
    // Probably worth rethinking what we emit here,
    // but it doesn't seem like a big deal right now, so…
    rawProfiles: {
      map: String(function (doc) {
        const parts = doc._id.split(':');
        const type = parts[0];

        switch (type) {
          case 'id': {
            emit(doc.id, {
              id: doc.id,
              hash: doc.hash,
              aliases: []
            });
            break;
          }

          case 'alias': {
            emit(doc.id, {
              id: null,
              hash: null,
              aliases: [{
                public: doc.public,
                date: doc.date,
                type: parts[1],
                value: parts[2]
              }]
            });
            break;
          }

          default:
            break;
        }
      }),
    }
  },

  lists: {
    // Return all the things for single profile.
    // (Looks like we won't need to fetch multiple profiles in one DB request.)
    profiles: String(function (head, req) {
      // Check that `key` query string param is present (`req.query.key`)
      // (because things do not make sense otherwise).
      if ((typeof req.query.key !== 'string') || (req.query.key.length === 0))
        throw new Error('MissingKeyParam');

      const profile = {
        id: null,
        hash: null,
        aliases: []
      };

      // `row` is w/ever `emit()` call get translated to by Couch.
      // `doc` is 2-nd argument to `emit()`.
      var row; // eslint-disable-line no-var, no-unused-vars
      var doc; // eslint-disable-line no-var

      while (row = getRow()) {
        doc = row.value;
        profile.id = profile.id || doc.id;
        profile.hash = profile.hash || doc.hash;
        profile.aliases = profile.aliases.concat(doc.aliases);
      }

      send(JSON.stringify(profile));
    })
  }
};

if (!module.parent)
  require('../utils').debugPrint(module.exports, {json: true});
