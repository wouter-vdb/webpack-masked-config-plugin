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

  describe('Debug', () => {
    it('should debug', (done) => {
      const target = 'test_debug_1.config.js';
      let debugCount = 0;
      const options = {
        plugins: [
          new MaskedConfig({
            debug: true,
            log: {
              debug: () => {
                debugCount++;
              }
            },
            source: './test/case_1',
            mask: {
              val_1: true,
              obj_A: {
                val_A2: true
              }
            },
            extend: {
              val_3: 789,
              obj_A: {
                val_A3: 'ghi'
              }
            },
            morph: (config) => {
              config.val_2 = 'new_val_2';
              return config;
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
        assert.deepEqual(Object.keys(result).sort(), ['obj_A', 'val_1', 'val_2', 'val_3']);
        assert.equal(result.val_1, 123);
        assert.equal(result.val_2, 'new_val_2');
        assert.equal(result.val_3, 789);

        assert.isObject(result.obj_A);
        assert.deepEqual(Object.keys(result.obj_A).sort(), ['val_A2', 'val_A3']);
        assert.equal(result.obj_A.val_A2, 'def');
        assert.equal(result.obj_A.val_A3, 'ghi');

        assert.equal(debugCount, 6);

        done();
      });
    });
  });

  after((done) => {
    rimraf('./test/output/', (error) => {
      if (error) {
        console.error('Failed to remove output dir after tests.', error);
      }
      done();
    });
  });

});
