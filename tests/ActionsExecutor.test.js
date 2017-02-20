'use strict';

const BaseAction = require('../src/actions/BaseAction');
const ActionsExecutor = require('../src/ActionsExecutor');

describe('ActionsExecutor', () => {
  describe('#run()', () => {
    class TestAction extends BaseAction {
      constructor (resultsRef, num) {
        super();
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

    class FailingAction extends BaseAction {
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

    it('Runs all `check()`s before `execute()`ing any actions', (done) => {
      const checks = [];
      const executes = [];

      class CheckableAction extends BaseAction {
        check (cb) {
          checks.push(Date.now());
          setTimeout(cb, 5, null);
        }

        execute (cb) {
          executes.push(Date.now());
          setTimeout(cb, 5, null);
        }
      }

      const executor = new ActionsExecutor([
        new CheckableAction(),
        new CheckableAction()
      ]);

      executor.run((err) => {
        expect(err).to.be.null;
        expect(checks).to.have.length(2);
        expect(checks[checks.length - 1]).not.to.be.above(executes[0]);
        done();
      });
    });

    it('Does not run any `execute()`s if check fails', (done) => {
      class FailingCheckAction extends BaseAction {
        check (cb) {
          setImmediate(cb, new Error('FailingCheckAction'));
        }

        execute () { throw new Error('Never should get here'); }
      }

      new ActionsExecutor([new FailingCheckAction()]).run(err => {
        expect(err).to.be.an('error');
        expect(err.message).to.equal('FailingCheckAction');
        done();
      });
    });

    it('Failing rollbacks do not break others', (done) => {
      let rolledback = false;

      class Rollbackable extends BaseAction {
        execute (cb) { setImmediate(cb, null); }
        rollback (cb) {
          rolledback = true;
          setImmediate(cb);
        }
      }

      class FailingRollback extends BaseAction {
        execute (cb) { setImmediate(cb, null); }
        rollback (cb) { setImmediate(cb, new Error('FailingRollback')); }
      }

      class FailingAction extends BaseAction {
        execute (cb) { setImmediate(cb, new Error('FailingAction')); }
      }

      new ActionsExecutor([
        new Rollbackable(),    // goes well
        new FailingRollback(), // goes well, but rollback errors
        new FailingAction()    // fails, so triggers above rollbacks
      ]).run((err) => {
        expect(err).to.be.instanceof(Error);
        expect(err.message).to.equal('FailingAction');
        expect(rolledback).to.be.equal(true);
        done();
      });
    });
  });
});
