"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfig = getConfig;
exports.doMergeConfigs = doMergeConfigs;
exports.validateConfig = validateConfig;
exports.computeDefaultAppDirectory = computeDefaultAppDirectory;

function _builderUtil() {
  const data = require("builder-util");

  _builderUtil = function () {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("builder-util/out/fs");

  _fs = function () {
    return data;
  };

  return data;
}

function _fsExtra() {
  const data = require("fs-extra");

  _fsExtra = function () {
    return data;
  };

  return data;
}

function _lazyVal() {
  const data = require("lazy-val");

  _lazyVal = function () {
    return data;
  };

  return data;
}

var path = _interopRequireWildcard(require("path"));

function _readConfigFile() {
  const data = require("read-config-file");

  _readConfigFile = function () {
    return data;
  };

  return data;
}

function _rectCra() {
  const data = require("../presets/rectCra");

  _rectCra = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const validateSchema = require("@develar/schema-utils"); // https://github.com/electron-userland/electron-builder/issues/1847


function mergePublish(config, configFromOptions) {
  // if config from disk doesn't have publish (or object), no need to handle, it will be simply merged by deepAssign
  const publish = Array.isArray(config.publish) ? configFromOptions.publish : null;

  if (publish != null) {
    delete configFromOptions.publish;
  }

  (0, _builderUtil().deepAssign)(config, configFromOptions);

  if (publish == null) {
    return;
  }

  const listOnDisk = config.publish;

  if (listOnDisk.length === 0) {
    config.publish = publish;
  } else {
    // apply to first
    Object.assign(listOnDisk[0], publish);
  }
}

async function getConfig(projectDir, configPath, configFromOptions, packageMetadata = new (_lazyVal().Lazy)(() => (0, _readConfigFile().orNullIfFileNotExist)((0, _fsExtra().readJson)(path.join(projectDir, "package.json"))))) {
  const configRequest = {
    packageKey: "build",
    configFilename: "electron-builder",
    projectDir,
    packageMetadata
  };
  const configAndEffectiveFile = await (0, _readConfigFile().getConfig)(configRequest, configPath);
  const config = configAndEffectiveFile == null ? {} : configAndEffectiveFile.result;

  if (configFromOptions != null) {
    mergePublish(config, configFromOptions);
  }

  if (configAndEffectiveFile != null) {
    _builderUtil().log.info({
      file: configAndEffectiveFile.configFile == null ? 'package.json ("build" field)' : configAndEffectiveFile.configFile
    }, "loaded configuration");
  }

  if (config.extends == null && config.extends !== null) {
    const metadata = (await packageMetadata.value) || {};
    const devDependencies = metadata.devDependencies;
    const dependencies = metadata.dependencies;

    if (dependencies != null && "react-scripts" in dependencies || devDependencies != null && "react-scripts" in devDependencies) {
      config.extends = "react-cra";
    } else if (devDependencies != null && "electron-webpack" in devDependencies) {
      let file = "electron-webpack/out/electron-builder.js";

      try {
        file = require.resolve(file);
      } catch (ignore) {
        file = require.resolve("electron-webpack/electron-builder.yml");
      }

      config.extends = `file:${file}`;
    }
  }

  let parentConfig;

  if (config.extends === "react-cra") {
    parentConfig = await (0, _rectCra().reactCra)(projectDir);

    _builderUtil().log.info({
      preset: config.extends
    }, "loaded parent configuration");
  } else if (config.extends != null) {
    const parentConfigAndEffectiveFile = await (0, _readConfigFile().loadParentConfig)(configRequest, config.extends);

    _builderUtil().log.info({
      file: parentConfigAndEffectiveFile.configFile
    }, "loaded parent configuration");

    parentConfig = parentConfigAndEffectiveFile.result;
  } else {
    parentConfig = null;
  }

  return doMergeConfigs(config, parentConfig);
} // normalize for easy merge


function normalizeFiles(configuration, name) {
  let value = configuration[name];

  if (value == null) {
    return;
  }

  if (!Array.isArray(value)) {
    value = [value];
  }

  itemLoop: for (let i = 0; i < value.length; i++) {
    let item = value[i];

    if (typeof item === "string") {
      // merge with previous if possible
      if (i !== 0) {
        let prevItemIndex = i - 1;
        let prevItem;

        do {
          prevItem = value[prevItemIndex--];
        } while (prevItem == null);

        if (prevItem.from == null && prevItem.to == null) {
          if (prevItem.filter == null) {
            prevItem.filter = [item];
          } else {
            prevItem.filter.push(item);
          }

          value[i] = null;
          continue itemLoop;
        }
      }

      item = {
        filter: [item]
      };
      value[i] = item;
    } else if (Array.isArray(item)) {
      throw new Error(`${name} configuration is invalid, nested array not expected for index ${i}: ` + item);
    } // make sure that merge logic is not complex - unify different presentations


    if (item.from === ".") {
      item.from = undefined;
    }

    if (item.to === ".") {
      item.to = undefined;
    }

    if (item.filter != null && typeof item.filter === "string") {
      item.filter = [item.filter];
    }
  }

  configuration[name] = value.filter(it => it != null);
}

function mergeFiles(configuration, parentConfiguration, mergedConfiguration, name) {
  const list = configuration[name];
  const parentList = parentConfiguration[name];

  if (list == null || parentList == null) {
    return;
  }

  const result = list.slice();
  mergedConfiguration[name] = result;

  itemLoop: for (const item of parentConfiguration.files) {
    for (const existingItem of list) {
      if (existingItem.from === item.from && existingItem.to === item.to) {
        if (item.filter != null) {
          if (existingItem.filter == null) {
            existingItem.filter = item.filter.slice();
          } else {
            existingItem.filter = item.filter.concat(existingItem.filter);
          }
        }

        continue itemLoop;
      }
    } // existing item not found, simply add


    result.push(item);
  }
}

function doMergeConfigs(configuration, parentConfiguration) {
  normalizeFiles(configuration, "files");
  normalizeFiles(configuration, "extraFiles");
  normalizeFiles(configuration, "extraResources");

  if (parentConfiguration == null) {
    return (0, _builderUtil().deepAssign)(getDefaultConfig(), configuration);
  }

  normalizeFiles(parentConfiguration, "files");
  normalizeFiles(parentConfiguration, "extraFiles");
  normalizeFiles(parentConfiguration, "extraResources");
  const result = (0, _builderUtil().deepAssign)(getDefaultConfig(), parentConfiguration, configuration);
  mergeFiles(configuration, parentConfiguration, result, "files");
  return result;
}

function getDefaultConfig() {
  return {
    directories: {
      output: "dist",
      buildResources: "build"
    }
  };
}

const schemeDataPromise = new (_lazyVal().Lazy)(() => (0, _fsExtra().readJson)(path.join(__dirname, "..", "..", "scheme.json")));

async function validateConfig(config, debugLogger) {
  const extraMetadata = config.extraMetadata;

  if (extraMetadata != null) {
    if (extraMetadata.build != null) {
      throw new (_builderUtil().InvalidConfigurationError)(`--em.build is deprecated, please specify as -c"`);
    }

    if (extraMetadata.directories != null) {
      throw new (_builderUtil().InvalidConfigurationError)(`--em.directories is deprecated, please specify as -c.directories"`);
    }
  }

  const oldConfig = config;

  if (oldConfig.npmSkipBuildFromSource === false) {
    throw new (_builderUtil().InvalidConfigurationError)(`npmSkipBuildFromSource is deprecated, please use buildDependenciesFromSource"`);
  }

  if (oldConfig.appImage != null && oldConfig.appImage.systemIntegration != null) {
    throw new (_builderUtil().InvalidConfigurationError)(`appImage.systemIntegration is deprecated, https://github.com/TheAssassin/AppImageLauncher is used for desktop integration"`);
  } // noinspection JSUnusedGlobalSymbols


  validateSchema((await schemeDataPromise.value), config, {
    name: `electron-builder ${"21.2.0"}`,
    postFormatter: (formattedError, error) => {
      if (debugLogger.isEnabled) {
        debugLogger.add("invalidConfig", (0, _builderUtil().safeStringifyJson)(error));
      }

      const site = "https://www.electron.build";
      let url = `${site}/configuration/configuration`;
      const targets = new Set(["mac", "dmg", "pkg", "mas", "win", "nsis", "appx", "linux", "appimage", "snap"]);
      const dataPath = error.dataPath == null ? null : error.dataPath;
      const targetPath = dataPath.startsWith(".") ? dataPath.substr(1).toLowerCase() : null;

      if (targetPath != null && targets.has(targetPath)) {
        url = `${site}/configuration/${targetPath}`;
      }

      return `${formattedError}\n  How to fix:
  1. Open ${url}
  2. Search the option name on the page (or type in into Search to find across the docs).
    * Not found? The option was deprecated or not exists (check spelling).
    * Found? Check that the option in the appropriate place. e.g. "title" only in the "dmg", not in the root.
`;
    }
  });
}

const DEFAULT_APP_DIR_NAMES = ["app", "www"];

async function computeDefaultAppDirectory(projectDir, userAppDir) {
  if (userAppDir != null) {
    const absolutePath = path.resolve(projectDir, userAppDir);
    const stat = await (0, _fs().statOrNull)(absolutePath);

    if (stat == null) {
      throw new (_builderUtil().InvalidConfigurationError)(`Application directory ${userAppDir} doesn't exist`);
    } else if (!stat.isDirectory()) {
      throw new (_builderUtil().InvalidConfigurationError)(`Application directory ${userAppDir} is not a directory`);
    } else if (projectDir === absolutePath) {
      _builderUtil().log.warn({
        appDirectory: userAppDir
      }, `Specified application directory equals to project dir — superfluous or wrong configuration`);
    }

    return absolutePath;
  }

  for (const dir of DEFAULT_APP_DIR_NAMES) {
    const absolutePath = path.join(projectDir, dir);
    const packageJson = path.join(absolutePath, "package.json");
    const stat = await (0, _fs().statOrNull)(packageJson);

    if (stat != null && stat.isFile()) {
      return absolutePath;
    }
  }

  return projectDir;
} 
// __ts-babel@6.0.4
//# sourceMappingURL=config.js.map