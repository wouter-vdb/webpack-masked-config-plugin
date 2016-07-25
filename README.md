# webpack-masked-config-plugin

## Synopsis

This [WebPack][] plugin loads a configuration object from one or several config files. It optionally excludes values from the configuration according to a given mask object, and/or extends it with additional properties. The plugin then saves the resulting configuration object as a module that can be included in the asset bundles produced by WebPack.

This plugin is useful when you want to manage the front-end and back-end configuration for one or multiple apps and multiple deployment modes from a single set of configuration files.

This plugin uses [node-config](https://www.npmjs.com/package/config) to load the configuration object and [object-mask](https://www.npmjs.com/package/object-mask) to mask it.


## Using this plugin
 
To use this plugin you need to add it in the `plugins` list in the `webpack.config.js` file. The following options can be specified in an object passed to the plugin constructor.

| option | type | description |
|:------:|:----:|:------------|
| `source` | string | The configuration is normally loaded from the `./config` directory relative to the running process. You can optionally specify a different source directory by providing its path as the `source` option. This path is resolved with respect to the current working directory[^1] and assigned to the `NODE_CONFIG_DIR` evironment variable, which is taken into account by the  [config loader](https://www.npmjs.com/package/config) used in this plugin.
| `env` | string | The [config loader](https://www.npmjs.com/package/config) used in this plugin allows you to customize the default configuration depending on the value of the `NODE_ENV` environment. You can optionally set/override the value for this variable while loading the configuration by providing it as the `env` option. The original value is restored after loading the configuration.
| `mask` | object | You can optionally mask the configuration object by specifying a masking object. This object determines which parts of the source configuration object are included in the target configuration object. All properties that are not in the mask object are excluded from the target configuration object. The masking is done by means of the [nested-object-mask](https://www.npmjs.com/package/nested-object-mask) package.
| `extend` | object | Optionally add values in the target configuration at build-time by extending is with the given object. The configuration is extended with the [_extendDeep_ utiliy](https://github.com/lorenwest/node-config/wiki/Using-Config-Utilities) in the the node-config package.
| `morph` | function | Optionally transform the config object arbitrarily. The given function is called with the masked and extended config object as sole argument. It should return the target config object, which may be the given config object that was modified, or a new object.
| `target` | string | The resulting configuration object is normally saved as a loadable module in `config.js` in the current working directory. You can override the location and name of this module by providing the target path as this option.

[^1]: The value of `process.cwd()`.

The following example instructs WebPack to:

1. load the configuration for the `production` mode managed in the `shared-config` folder;
2. retain only the `service.host` and `service.port` settings and remove all other sensitive server-side settings;
3. add the value of the `HOST` environment variable as `service.host` setting;
4. save the resulting configuration object as the index module in the `build` directory. 

```js
const MaskedConfig = require('./webpack-masked-config-plugin');

module.exports = {
  plugins: {
    new MaskedConfig({
      source: '../shared-config',
      env: 'production',
      mask: {
        service: {
          host: true,
          port: true
        }
      },
      extend: {
        service: {
          host: process.env.HOST
        }
      },
      target: 'build/index.js',
    }),
  },
  ...
};
```


## Dependencies

This plugin has been tested for WebPack versions 1.12.14.


## Testing

To run the tests, execute:

```bash
npm install
npm test
```

[WebPack]: https://webpack.github.io
