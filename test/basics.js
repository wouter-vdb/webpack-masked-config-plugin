'use strict';

const assert = require('chai').assert;
const fs = require('fs');
const MaskedConfig = require('../lib/index.js');
const rimraf = require('rimraf');
const webpack = require('webpack');

// -------------------------------------------------------------------------------------------------

function unloadConfig() {
  const name = require.resolve('config');
  delete require.cache[name];
}

// -------------------------------------------------------------------------------------------------



describe('TestCases', () => {

  describe('1: Config loading', () => {
    it('should include all config values', (done) => {
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1'
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require('../config.js');
        //console.log('- test_1 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result), ['val_1', 'val_2', 'obj_A']);
        assert.equal(result.val_1, 123);
        assert.equal(result.val_2, 456);
        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A), ['val_A1', 'val_A2']);
        assert.equal(result.obj_A.val_A1, 'abc');
        assert.equal(result.obj_A.val_A2, 'def');

        done();
      });
    });
  });

  describe('2: Targeted writing', () => {
    it('should write the config file at a custom location', (done) => {
      const target = 'test_2.config.js';
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1',
            target: `./test/output/${target}`
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require(`./output/${target}`);
        //console.log('- test_2 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result), ['val_1', 'val_2', 'obj_A']);
        assert.equal(result.val_1, 123);
        assert.equal(result.val_2, 456);
        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A), ['val_A1', 'val_A2']);
        assert.equal(result.obj_A.val_A1, 'abc');
        assert.equal(result.obj_A.val_A2, 'def');

        done();
      });
    });
  });

  describe('3: Property masking', () => {
    it('should mask config values', (done) => {
      const target = 'test_3.config.js';
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1',
            mask: {
              val_1: true,
              obj_A: {
                val_A2: true
              }
            },
            target: `./test/output/${target}`
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require(`./output/${target}`);
        //console.log('- test_3 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result), ['val_1', 'obj_A']);
        assert.equal(result.val_1, 123);
        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A), ['val_A2']);
        assert.equal(result.obj_A.val_A2, 'def');

        done();
      });
    });
  });

  describe('4: Full object masking', () => {
    it('should mask config values', (done) => {
      const target = 'test_4.config.js';
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1',
            mask: {
              obj_A: true
            },
            target: `./test/output/${target}`
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require(`./output/${target}`);
        //console.log('- test_4 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result), ['obj_A']);
        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A), ['val_A1', 'val_A2']);
        assert.equal(result.obj_A.val_A1, 'abc');
        assert.equal(result.obj_A.val_A2, 'def');

        done();
      });
    });
  });

  describe('5: Extend', () => {
    it('should extend config values', (done) => {
      const target = 'test_5.config.js';
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1',
            extend: {
              val_3: 789,
              obj_A: {
                val_A3: 'ghi'
              },
              obj_B: {
                val_B1: 'jkl'
              }
            },
            target: `./test/output/${target}`
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require(`./output/${target}`);
        //console.log('- test_5 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result).sort(), ['obj_A', 'obj_B', 'val_1', 'val_2', 'val_3']);
        assert.equal(result.val_1, 123);
        assert.equal(result.val_2, 456);
        assert.equal(result.val_3, 789);

        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A).sort(), ['val_A1', 'val_A2', 'val_A3']);
        assert.equal(result.obj_A.val_A1, 'abc');
        assert.equal(result.obj_A.val_A2, 'def');
        assert.equal(result.obj_A.val_A3, 'ghi');

        assert.isObject(result.obj_B);
        assert.deepEqual(Object.keys(result.obj_B).sort(), ['val_B1']);
        assert.equal(result.obj_B.val_B1, 'jkl');

        done();
      });
    });
  });

  describe('6: Mask and extend', () => {
    it('should mask and extend config values', (done) => {
      const target = 'test_6.config.js';
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1',
            mask: {
              obj_A: true
            },
            extend: {
              val_3: 789,
              obj_A: {
                val_A3: 'ghi'
              },
              obj_B: {
                val_B1: 'jkl'
              }
            },
            target: `./test/output/${target}`
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require(`./output/${target}`);
        //console.log('- test_6 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result).sort(), ['obj_A', 'obj_B', 'val_3']);
        assert.equal(result.val_3, 789);

        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A).sort(), ['val_A1', 'val_A2', 'val_A3']);
        assert.equal(result.obj_A.val_A1, 'abc');
        assert.equal(result.obj_A.val_A2, 'def');
        assert.equal(result.obj_A.val_A3, 'ghi');

        assert.isObject(result.obj_B);
        assert.deepEqual(Object.keys(result.obj_B).sort(), ['val_B1']);
        assert.equal(result.obj_B.val_B1, 'jkl');

        done();
      });
    });
  });

  describe('7: Production environment', () => {
    it('should load the production config', (done) => {
      unloadConfig();
      const target = 'test_7.config.js';
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1',
            env: 'production',
            target: `./test/output/${target}`
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require(`./output/${target}`);
        //console.log('- test_7 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result), ['val_1', 'val_2', 'obj_A']);
        assert.equal(result.val_1, 222);
        assert.equal(result.val_2, 456);
        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A), ['val_A1', 'val_A2', 'val_A3']);
        assert.equal(result.obj_A.val_A1, 'abc');
        assert.equal(result.obj_A.val_A2, 'prod');
        assert.equal(result.obj_A.val_A3, 'ghi');

        done();
      });
    });
  });

  describe('8: Morph', () => {
    it('should morph the config', (done) => {
      unloadConfig();
      const target = 'test_8.config.js';
      const options = {
        plugins: [
          new MaskedConfig({
            source: './test/case_1',
            env: 'development',
            morph: (config) => ({ m1: 123, m2: { m3: 'morphed' }}),
            target: `./test/output/${target}`
          })
        ]
      };
      webpack(options, (error, stats) => {
        if (error) { throw error; }

        const result = require(`./output/${target}`);
        //console.log('- test_8 result:', result);

        assert.isObject(result);
        assert.deepEqual(Object.keys(result), ['m1', 'm2']);
        assert.equal(result.m1, 123);
        assert.isObject(result.m2);
        assert.deepEqual(Object.keys(result.m2), ['m3']);
        assert.equal(result.m2.m3, 'morphed');

        done();
      });
    });
  });

  after((done) => {
    fs.unlink('config.js', (error) => {
      if (error) {
        console.error('Failed to remove config.js.', error);
      }
      rimraf('./test/output/', (error) => {
        if (error) {
          console.error('Failed to remove output dir after tests.', error);
        }
        done();
      });
    });
  });

});
