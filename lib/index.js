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

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

// -------------------------------------------------------------------------------------------------

class MaskedConfigPlugin {

  /**
   * @param {Object} [options] - Options object. See README.md for more details.
   */
  constructor(options) {
    this.options = options;
  }

  /**
   * Required implementation.
   * @param {Object} compiler – The Webpack compiler.
   */
  apply(compiler) {
    const options = this.options;

    compiler.plugin('compile', (params) => {
      const errMsgPrefix = 'The webpack-masked-config-plugin failed to';

      let sourceDir, sourceConfig, maskedConfig = {}, target, nodeEnv;

      // Optionally specify the source directory.
      if (options.source !== undefined) {
        try {
          sourceDir = path.resolve(process.cwd(), options.source);
        }
        catch (err) {
          console.error(`${errMsgPrefix} resolve the source path '${options.source}'.`);
          throw err;
        }
        process.env.NODE_CONFIG_DIR = sourceDir;
      }

      // Optionally override the `NODE_ENV` environment variable.
      if (options.env !== undefined) {
        //console.log('config plugin - options.env:', options.env);  // DEBUG
        nodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = options.env;
      }

      // Load the configuration:
      try {
        sourceConfig = require('config');
        // remove util and functions:
        for (const key in sourceConfig) {
          if (sourceConfig.hasOwnProperty(key)) {
            maskedConfig[key] = sourceConfig[key];
          }
        }
      }
      catch (err) {
        console.error(`${errMsgPrefix} load the configuration.`);
        throw err;
      }
      //console.log('config plugin - original:', maskedConfig);  // DEBUG

      // Restore the original `NODE_ENV` value.
      if (nodeEnv !== undefined) {
        process.env.NODE_ENV = nodeEnv;
      }

      // Optionally mask the configuration:
      if (options.mask !== undefined) {
        const mask = require('nested-object-mask').mask;
        //console.log('config plugin - options.mask:', options.mask);  // DEBUG
        try {
          maskedConfig = mask(maskedConfig, options.mask, true);
          //console.log('config plugin - masked:', maskedConfig);  // DEBUG
        }
        catch (err) {
            console.error(`${errMsgPrefix} mask the configuration object.`);
            throw err;
        }
      }

      // Optionally extend the configuration:
      if (options.extend !== undefined) {
        try {
          //console.log('config plugin - options.extend:', options.extend);  // DEBUG
          maskedConfig = sourceConfig.util.extendDeep({}, maskedConfig, options.extend);
          //console.log('config plugin - extended:', maskedConfig);  // DEBUG
        }
        catch (err) {
          console.error(`${errMsgPrefix} extend the configuration object.`);
          throw err;
        }
      }

      // Optionally morph the configuration:
      if (options.morph !== undefined) {
        maskedConfig = options.morph(sourceConfig.util.cloneDeep(maskedConfig));
      }

      // Write the config file:
      //console.log('- process.cwd():', process.cwd());
      if (options.target !== undefined) {
        target = path.resolve(process.cwd(), options.target);
      }
      else {
        target = path.resolve(process.cwd(), 'config.js');
      }
      //console.log('config plugin - target:', target);  // DEBUG

      try {
        mkdirp.sync(path.dirname(target));
      }
      catch (err) {
        console.error(`${errMsgPrefix} create the target directory '${target}'.`);
        throw err;
      }
      try {
        maskedConfig = `/*eslint quote-props:0, quotes:0 */\n\n`
          + `module.exports = ${JSON.stringify(maskedConfig, null, 2)};\n`;
        fs.writeFileSync(target, maskedConfig);
      }
      catch (err) {
        console.error(`${errMsgPrefix} write the config file '${target}'.`);
        throw err;
      }
    });
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = MaskedConfigPlugin;
