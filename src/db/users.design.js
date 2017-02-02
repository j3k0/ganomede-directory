/* global emit:false getRow:false send:false */
'use strict';

// TODO
//
// Maybe add source-file comparison or git's modified date vs couch's one,
// so we won't have to recalc the whole view due to upgrading node and changed formatting.
// (Or maybe just add a version number, but that would require not forgetting to update it :)

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
    // TODO
    // This only works for single profile read. What about multiple with pages?
    profiles: String(function (head, req) {
      // TODO
      // Check that `key` query string param is present (`req.query.key`),
      // meaning we want profile of that userId; throw Error otherwise.
      // (because this does not make sense without it and will go over all docs).
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
