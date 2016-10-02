'use strict';

// The MIT License (MIT)
//
// Copyright (c) 2016 Wouter Van den Broeck
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

// -------------------------------------------------------------------------------------------------

/**
 * The plugin options object.
 * @typedef {Object} Options
 * @property {boolean} [debug = false] - When true, the steps in the transformation process are
 *           traced.
 * @property {Object} [log] - An object that has two methods: debug() en error(), which both take
 *           an arbitrary number of arguments and logs these appropriately.
 * @property {string} [source] - Path to the source directory.
 * @property {string} [env] - When given, the NODE_ENV environment variable is set to this value
 *           while loading the source configuration.
 * @property {Object} [mask] - When given, this object determines which parts of the source
 *           configuration object are included in the target configuration object. All properties
 *           that are not in the mask object are excluded from the target configuration object. The
 *           masking is done by means of the nested-object-mask package.
 * @property {string} [extend] - Add the values in this object in the target configuration. The
 *           configuration is extended with the extendDeep utiliy in the node-config package.
 * @property {string} [morph] - When given, this function is called with the masked and extended
 *           config object as sole argument. It should return the target config object, which may be
 *           the given config object that was modified, or a new object.
 * @property {string} [target = './config.js'] - The path of the target config file.
 * @property {string} [exportFormat = 'es6'] - The format of the export statement, either `es6`
 *           (`export default {config}`) or `commonjs` (`module.exports = {config}`).
 */

/**
 * @type {Options} The default options.
 */
const DEFAULT_OPTIONS = {
  debug: false,
  log: {
    debug: (...args) => console.log(...args),
    error: (...args) => console.error(...args)
  },
  target: './config.js',
  exportFormat: 'es6'
};

class MaskedConfigPlugin {

  /**
   * @param {Options} [options] - Options object. See README.md for more details.
   */
  constructor(options) {
    this.options = _.defaults({}, options, DEFAULT_OPTIONS);
    this.log = this.options.log;
  }

  debug(...args) {
    if (this.options.debug) {
      this.log.debug('webpack-masked-config:', ...args);
    }
  }

  /**
   * Required implementation.
   * @param {Object} compiler – The Webpack compiler.
   */
  apply(compiler) {
    const options = this.options;

    compiler.plugin('compile', () => {
      this.debug('options:', options);
      const errMsgPrefix = 'The webpack-masked-config-plugin failed to';

      let source, input, output = {}, file, oriEnv;

      // Optionally specify the source directory.
      if (_.isString(options.source)) {
        try {
          source = path.resolve(process.cwd(), options.source);
        }
        catch (err) {
          this.log.error(`${errMsgPrefix} resolve the source path '${options.source}'.`);
          throw err;
        }
        process.env.NODE_CONFIG_DIR = source;
      }

      // Optionally override the `NODE_ENV` environment variable.
      if (_.isString(options.env)) {
        oriEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = options.env;
      }

      // Load the configuration:
      try {
        input = require('config');
        // Copy all properties except `util` and the methods:
        for (const key in input) {
          if (input.hasOwnProperty(key)) {
            output[key] = input[key];
          }
        }
      }
      catch (err) {
        this.log.error(`${errMsgPrefix} load the configuration.`);
        throw err;
      }
      this.debug('- original:', output);

      // Restore the original `NODE_ENV` value.
      if (oriEnv !== undefined) {
        process.env.NODE_ENV = oriEnv;
      }

      // Optionally mask the configuration:
      if (!_.isUndefined(options.mask)) {
        const mask = require('nested-object-mask').mask;
        try {
          output = mask(output, options.mask, true);
          this.debug('- masked:', output);
        }
        catch (err) {
            this.log.error(`${errMsgPrefix} mask the configuration object.`);
            throw err;
        }
      }

      // Optionally extend the configuration:
      if (!_.isUndefined(options.extend)) {
        try {
          output = input.util.extendDeep({}, output, options.extend);
          this.debug('- extended:', output);
        }
        catch (err) {
          this.log.error(`${errMsgPrefix} extend the configuration object.`);
          throw err;
        }
      }

      // Optionally morph the configuration:
      if (_.isFunction(options.morph)) {
        output = options.morph(input.util.cloneDeep(output));
        this.debug('- morphed:', output);
      }

      // Write the config file:
      file = path.resolve(process.cwd(), options.target);
      this.debug('- saved as:', file);

      try {
        mkdirp.sync(path.dirname(file));
      }
      catch (err) {
        this.log.error(`${errMsgPrefix} create the target directory '${file}'.`);
        throw err;
      }
      try {
        output = `/*eslint quote-props:0, quotes:0 */\n\n`;
        if (options.exportFormat === 'es6') {
          output += 'export default ';
        }
        else if (options.exportFormat === '') {
          output += 'module.exports = ';
        }
        else {
          throw new Error(`Unexpected exportFormat '${options.exportFormat}'.`);
        }
        output += `${JSON.stringify(output, null, 2)};\n`;
        fs.writeFileSync(file, output);
      }
      catch (err) {
        this.log.error(`${errMsgPrefix} write the config file '${file}'.`);
        throw err;
      }
    });
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = MaskedConfigPlugin;
