'use strict';

const ActionsExecutor = require('../src/ActionsExecutor');

describe('ActionsExecutor', () => {
  describe('#run()', () => {
    class TestAction {
      constructor (resultsRef, num) {
        this.resultsRef = resultsRef;
        this.num = num;
      }

      execute (callback) {
        this.resultsRef.push(this.num);
        setImmediate(callback, null);
      }

      rollback (callback) {
        this.resultsRef.splice(this.resultsRef.length - 1, 1);
        setImmediate(callback, null);
      }
    }

    class FailingAction {
      execute (callback) {
        setImmediate(callback, new Error('FailingAction'));
      }
    }

    it('Runs actions one by one', (done) => {
      const results = [];
      const executor = new ActionsExecutor([
        new TestAction(results, 1),
        new TestAction(results, 2),
        new TestAction(results, 3)
      ]);

      executor.run((err) => {
        expect(err).to.be.null;
        expect(results).to.eql([1, 2, 3]);
        done();
      });
    });

    it('Reverts previous actions if some fail', (done) => {
      const results = [];
      const executor = new ActionsExecutor([
        new TestAction(results, 1),
        new TestAction(results, 2),
        new FailingAction()
      ]);

      executor.run((err) => {
        expect(err).to.be.an('error');
        expect(results).to.eql([]);
        done();
      });
    });
  });
});
