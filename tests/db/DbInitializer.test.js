'use strict';

const path = require('path');
const DbInitializer = require('../../src/db/DbInitializer');
const Design = require('../../src/db/Design');
const config = require('../../config');

// describe('DbInitializer', () => {
//   const missingDesign = new Design(path.resolve(__dirname, 'missing.design.js'));
//   const changedDesign = new Design(path.resolve(__dirname, 'changed.design.js'));
//   const unchangedDesign = new Design(path.resolve(__dirname, 'unchanged.design.js'));
//   const testDesigns = [missingDesign, changedDesign, unchangedDesign];

//   describe('#check()', () => {
//     it('detects database is created', (done) => {
//       const initializer = new DbInitializer(config.couch, testDesigns);

//       initializer.info((err, info) => {
//         expect(err).to.be.null;
//         expect(info).to.eql({
//           databaseExists: true,
//           designs: {
//             missing: null,
//             changed: true,
//             unchanged: false
//           }
//         });
//         done();
//       });
//     });

//     it('detects database is missing', (done) => {
//       const initializer = new DbInitializer({
//         url: config.couch.url,
//         name: 'some_nonsense_db_that_can_never_exist'
//       }, testDesigns);

//       initializer.info((err, info) => {
//         expect(err).to.be.null;
//         expect(info).to.eql({
//           databaseExists: false,
//           designs: {
//             missing: null,
//             changed: null,
//             unchanged: null
//           }
//         });
//         done();
//       });
//     });

//     // it('detects existing design docs', (done) => {
//     //   new DbInitializer(config.couch, [testDesign]).info((err, info) => {
//     //     expect(err).to.be.null;
//     //     expect(info).to.have.property('_design/test', false);
//     //     done();
//     //   });
//     // });
//   });
// });

describe.skip('DbInitializer', () => {
  const design = new Design(config.couch.designName, path.resolve(__dirname, '../../src/db/users.design.js'));
  const initializer = new DbInitializer(config.couch, [design], {sync: true});

  it('thingy', (done) => {
    initializer.init((err) => {
      expect(err).to.be.null;
      done();
    });
  });
});
