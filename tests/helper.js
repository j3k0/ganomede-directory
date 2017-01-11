'use strict';

const td = require('testdouble');
const {expect} = require('chai');

// td.print
// setImmediate(() => {
//         console.log('%s', td.explain(db.save).description)
//       })

global.td = td;
global.expect = expect;

afterEach(() => td.reset());
