"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Packager = void 0;

function _builderUtil() {
  const data = require("builder-util");

  _builderUtil = function () {
    return data;
  };

  return data;
}

function _builderUtilRuntime() {
  const data = require("builder-util-runtime");

  _builderUtilRuntime = function () {
    return data;
  };

  return data;
}

function _promise() {
  const data = require("builder-util/out/promise");

  _promise = function () {
    return data;
  };

  return data;
}

function _events() {
  const data = require("events");

  _events = function () {
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

function _isCi() {
  const data = _interopRequireDefault(require("is-ci"));

  _isCi = function () {
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

function _arch() {
  const data = require("builder-util/out/arch");

  _arch = function () {
    return data;
  };

  return data;
}

function _appInfo() {
  const data = require("./appInfo");

  _appInfo = function () {
    return data;
  };

  return data;
}

function _asar() {
  const data = require("./asar/asar");

  _asar = function () {
    return data;
  };

  return data;
}

function _ElectronFramework() {
  const data = require("./electron/ElectronFramework");

  _ElectronFramework = function () {
    return data;
  };

  return data;
}

function _LibUiFramework() {
  const data = require("./frameworks/LibUiFramework");

  _LibUiFramework = function () {
    return data;
  };

  return data;
}

function _index() {
  const data = require("./index");

  _index = function () {
    return data;
  };

  return data;
}

function _platformPackager() {
  const data = require("./platformPackager");

  _platformPackager = function () {
    return data;
  };

  return data;
}

function _ProtonFramework() {
  const data = require("./ProtonFramework");

  _ProtonFramework = function () {
    return data;
  };

  return data;
}

function _targetFactory() {
  const data = require("./targets/targetFactory");

  _targetFactory = function () {
    return data;
  };

  return data;
}

function _config() {
  const data = require("./util/config");

  _config = function () {
    return data;
  };

  return data;
}

function _macroExpander() {
  const data = require("./util/macroExpander");

  _macroExpander = function () {
    return data;
  };

  return data;
}

function _packageDependencies() {
  const data = require("./util/packageDependencies");

  _packageDependencies = function () {
    return data;
  };

  return data;
}

function _packageMetadata() {
  const data = require("./util/packageMetadata");

  _packageMetadata = function () {
    return data;
  };

  return data;
}

function _repositoryInfo() {
  const data = require("./util/repositoryInfo");

  _repositoryInfo = function () {
    return data;
  };

  return data;
}

function _yarn() {
  const data = require("./util/yarn");

  _yarn = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addHandler(emitter, event, handler) {
  emitter.on(event, handler);
}

async function createFrameworkInfo(configuration, packager) {
  let framework = configuration.framework;

  if (framework != null) {
    framework = framework.toLowerCase();
  }

  let nodeVersion = configuration.nodeVersion;

  if (framework === "electron" || framework == null) {
    return await (0, _ElectronFramework().createElectronFrameworkSupport)(configuration, packager);
  }

  if (nodeVersion == null || nodeVersion === "current") {
    nodeVersion = process.versions.node;
  }

  const distMacOsName = `${packager.appInfo.productFilename}.app`;
  const isUseLaunchUi = configuration.launchUiVersion !== false;

  if (framework === "proton" || framework === "proton-native") {
    return new (_ProtonFramework().ProtonFramework)(nodeVersion, distMacOsName, isUseLaunchUi);
  } else if (framework === "libui") {
    return new (_LibUiFramework().LibUiFramework)(nodeVersion, distMacOsName, isUseLaunchUi);
  } else {
    throw new (_builderUtil().InvalidConfigurationError)(`Unknown framework: ${framework}`);
  }
}

class Packager {
  //noinspection JSUnusedGlobalSymbols
  constructor(options, cancellationToken = new (_builderUtilRuntime().CancellationToken)()) {
    this.cancellationToken = cancellationToken;
    this._metadata = null;
    this._nodeModulesHandledExternally = false;
    this._isPrepackedAppAsar = false;
    this._devMetadata = null;
    this._configuration = null;
    this.isTwoPackageJsonProjectLayoutUsed = false;
    this.eventEmitter = new (_events().EventEmitter)();
    this._appInfo = null;
    this.tempDirManager = new (_builderUtil().TmpDir)("packager");
    this._repositoryInfo = new (_lazyVal().Lazy)(() => (0, _repositoryInfo().getRepositoryInfo)(this.projectDir, this.metadata, this.devMetadata));
    this.afterPackHandlers = [];
    this.debugLogger = new (_builderUtil().DebugLogger)(_builderUtil().log.isDebugEnabled);
    this.nodeDependencyInfo = new Map();

    this.stageDirPathCustomizer = (target, packager, arch) => {
      return path.join(target.outDir, `__${target.name}-${(0, _arch().getArtifactArchName)(arch, target.name)}`);
    };

    this._buildResourcesDir = null;
    this._framework = null;
    this.toDispose = [];

    if ("devMetadata" in options) {
      throw new (_builderUtil().InvalidConfigurationError)("devMetadata in the options is deprecated, please use config instead");
    }

    if ("extraMetadata" in options) {
      throw new (_builderUtil().InvalidConfigurationError)("extraMetadata in the options is deprecated, please use config.extraMetadata instead");
    }

    const targets = options.targets || new Map();

    if (options.targets == null) {
      options.targets = targets;
    }

    function processTargets(platform, types) {
      function commonArch(currentIfNotSpecified) {
        if (platform === _index().Platform.MAC) {
          return currentIfNotSpecified ? [_builderUtil().Arch.x64] : [];
        }

        const result = Array();
        return result.length === 0 && currentIfNotSpecified ? [(0, _builderUtil().archFromString)(process.arch)] : result;
      }

      let archToType = targets.get(platform);

      if (archToType == null) {
        archToType = new Map();
        targets.set(platform, archToType);
      }

      if (types.length === 0) {
        for (const arch of commonArch(false)) {
          archToType.set(arch, []);
        }

        return;
      }

      for (const type of types) {
        const suffixPos = type.lastIndexOf(":");

        if (suffixPos > 0) {
          (0, _builderUtil().addValue)(archToType, (0, _builderUtil().archFromString)(type.substring(suffixPos + 1)), type.substring(0, suffixPos));
        } else {
          for (const arch of commonArch(true)) {
            (0, _builderUtil().addValue)(archToType, arch, type);
          }
        }
      }
    }

    if (options.mac != null) {
      processTargets(_index().Platform.MAC, options.mac);
    }

    if (options.linux != null) {
      processTargets(_index().Platform.LINUX, options.linux);
    }

    if (options.win != null) {
      processTargets(_index().Platform.WINDOWS, options.win);
    }

    this.projectDir = options.projectDir == null ? process.cwd() : path.resolve(options.projectDir);
    this._appDir = this.projectDir;
    this.options = Object.assign(Object.assign({}, options), {
      prepackaged: options.prepackaged == null ? null : path.resolve(this.projectDir, options.prepackaged)
    });

    try {
      _builderUtil().log.info({
        version: "21.2.0",
        os: require("os").release()
      }, "electron-builder");
    } catch (e) {
      // error in dev mode without babel
      if (!(e instanceof ReferenceError)) {
        throw e;
      }
    }
  }

  get appDir() {
    return this._appDir;
  }

  get metadata() {
    return this._metadata;
  }

  get areNodeModulesHandledExternally() {
    return this._nodeModulesHandledExternally;
  }

  get isPrepackedAppAsar() {
    return this._isPrepackedAppAsar;
  }

  get devMetadata() {
    return this._devMetadata;
  }

  get config() {
    return this._configuration;
  }

  get appInfo() {
    return this._appInfo;
  }

  get repositoryInfo() {
    return this._repositoryInfo.value;
  }

  getNodeDependencyInfo(platform) {
    let key = "";
    let excludedDependencies = null;

    if (platform != null && this.framework.getExcludedDependencies != null) {
      excludedDependencies = this.framework.getExcludedDependencies(platform);

      if (excludedDependencies != null) {
        key += `-${platform.name}`;
      }
    }

    let result = this.nodeDependencyInfo.get(key);

    if (result == null) {
      result = (0, _packageDependencies().createLazyProductionDeps)(this.appDir, excludedDependencies);
      this.nodeDependencyInfo.set(key, result);
    }

    return result;
  }

  get buildResourcesDir() {
    let result = this._buildResourcesDir;

    if (result == null) {
      result = path.resolve(this.projectDir, this.relativeBuildResourcesDirname);
      this._buildResourcesDir = result;
    }

    return result;
  }

  get relativeBuildResourcesDirname() {
    return this.config.directories.buildResources;
  }

  get framework() {
    return this._framework;
  }

  disposeOnBuildFinish(disposer) {
    this.toDispose.push(disposer);
  }

  addAfterPackHandler(handler) {
    this.afterPackHandlers.push(handler);
  }

  artifactCreated(handler) {
    addHandler(this.eventEmitter, "artifactCreated", handler);
    return this;
  }

  async callArtifactBuildStarted(event, logFields) {
    _builderUtil().log.info(logFields || {
      target: event.targetPresentableName,
      arch: event.arch == null ? null : _builderUtil().Arch[event.arch],
      file: _builderUtil().log.filePath(event.file)
    }, "building");

    const handler = (0, _platformPackager().resolveFunction)(this.config.artifactBuildStarted, "artifactBuildStarted");

    if (handler != null) {
      await Promise.resolve(handler(event));
    }
  }
  /**
   * Only for sub artifacts (update info), for main artifacts use `callArtifactBuildCompleted`.
   */


  dispatchArtifactCreated(event) {
    this.eventEmitter.emit("artifactCreated", event);
  }

  async callArtifactBuildCompleted(event) {
    this.dispatchArtifactCreated(event);
    const handler = (0, _platformPackager().resolveFunction)(this.config.artifactBuildCompleted, "artifactBuildCompleted");

    if (handler != null) {
      await Promise.resolve(handler(event));
    }
  }

  async build() {
    let configPath = null;
    let configFromOptions = this.options.config;

    if (typeof configFromOptions === "string") {
      // it is a path to config file
      configPath = configFromOptions;
      configFromOptions = null;
    } else if (configFromOptions != null && configFromOptions.extends != null && configFromOptions.extends.includes(".")) {
      configPath = configFromOptions.extends;
      delete configFromOptions.extends;
    }

    const projectDir = this.projectDir;
    const devPackageFile = path.join(projectDir, "package.json");
    this._devMetadata = await (0, _promise().orNullIfFileNotExist)((0, _packageMetadata().readPackageJson)(devPackageFile));
    const devMetadata = this.devMetadata;
    const configuration = await (0, _config().getConfig)(projectDir, configPath, configFromOptions, new (_lazyVal().Lazy)(() => Promise.resolve(devMetadata)));

    if (_builderUtil().log.isDebugEnabled) {
      _builderUtil().log.debug({
        config: getSafeEffectiveConfig(configuration)
      }, "effective config");
    }

    this._appDir = await (0, _config().computeDefaultAppDirectory)(projectDir, configuration.directories.app);
    this.isTwoPackageJsonProjectLayoutUsed = this._appDir !== projectDir;
    const appPackageFile = this.isTwoPackageJsonProjectLayoutUsed ? path.join(this.appDir, "package.json") : devPackageFile; // tslint:disable:prefer-conditional-expression

    if (this.devMetadata != null && !this.isTwoPackageJsonProjectLayoutUsed) {
      this._metadata = this.devMetadata;
    } else {
      this._metadata = await this.readProjectMetadataIfTwoPackageStructureOrPrepacked(appPackageFile);
    }

    (0, _builderUtil().deepAssign)(this.metadata, configuration.extraMetadata);

    if (this.isTwoPackageJsonProjectLayoutUsed) {
      _builderUtil().log.debug({
        devPackageFile,
        appPackageFile
      }, "two package.json structure is used");
    }

    (0, _packageMetadata().checkMetadata)(this.metadata, this.devMetadata, appPackageFile, devPackageFile);
    return await this._build(configuration, this._metadata, this._devMetadata);
  } // external caller of this method always uses isTwoPackageJsonProjectLayoutUsed=false and appDir=projectDir, no way (and need) to use another values


  async _build(configuration, metadata, devMetadata, repositoryInfo) {
    await (0, _config().validateConfig)(configuration, this.debugLogger);
    this._configuration = configuration;
    this._metadata = metadata;
    this._devMetadata = devMetadata;

    if (repositoryInfo != null) {
      this._repositoryInfo.value = Promise.resolve(repositoryInfo);
    }

    this._appInfo = new (_appInfo().AppInfo)(this, null);
    this._framework = await createFrameworkInfo(this.config, this);
    const commonOutDirWithoutPossibleOsMacro = path.resolve(this.projectDir, (0, _macroExpander().expandMacro)(configuration.directories.output, null, this._appInfo, {
      os: ""
    }));

    if (!_isCi().default && process.stdout.isTTY) {
      const effectiveConfigFile = path.join(commonOutDirWithoutPossibleOsMacro, "builder-effective-config.yaml");

      _builderUtil().log.info({
        file: _builderUtil().log.filePath(effectiveConfigFile)
      }, "writing effective config");

      await (0, _fsExtra().outputFile)(effectiveConfigFile, getSafeEffectiveConfig(configuration));
    } // because artifact event maybe dispatched several times for different publish providers


    const artifactPaths = new Set();
    this.artifactCreated(event => {
      if (event.file != null) {
        artifactPaths.add(event.file);
      }
    });
    this.disposeOnBuildFinish(() => this.tempDirManager.cleanup());
    const platformToTargets = await (0, _promise().executeFinally)(this.doBuild(), async () => {
      if (this.debugLogger.isEnabled) {
        await this.debugLogger.save(path.join(commonOutDirWithoutPossibleOsMacro, "builder-debug.yml"));
      }

      const toDispose = this.toDispose.slice();
      this.toDispose.length = 0;

      for (const disposer of toDispose) {
        await disposer().catch(e => {
          _builderUtil().log.warn({
            error: e
          }, "cannot dispose");
        });
      }
    });
    return {
      outDir: commonOutDirWithoutPossibleOsMacro,
      artifactPaths: Array.from(artifactPaths),
      platformToTargets,
      configuration
    };
  }

  async readProjectMetadataIfTwoPackageStructureOrPrepacked(appPackageFile) {
    let data = await (0, _promise().orNullIfFileNotExist)((0, _packageMetadata().readPackageJson)(appPackageFile));

    if (data != null) {
      return data;
    }

    data = await (0, _promise().orNullIfFileNotExist)((0, _asar().readAsarJson)(path.join(this.projectDir, "app.asar"), "package.json"));

    if (data != null) {
      this._isPrepackedAppAsar = true;
      return data;
    }

    throw new Error(`Cannot find package.json in the ${path.dirname(appPackageFile)}`);
  }

  async doBuild() {
    const taskManager = new (_builderUtil().AsyncTaskManager)(this.cancellationToken);
    const platformToTarget = new Map();
    const createdOutDirs = new Set();

    for (const [platform, archToType] of this.options.targets) {
      if (this.cancellationToken.cancelled) {
        break;
      }

      if (platform === _index().Platform.MAC && process.platform === _index().Platform.WINDOWS.nodeName) {
        throw new (_builderUtil().InvalidConfigurationError)("Build for macOS is supported only on macOS, please see https://electron.build/multi-platform-build");
      }

      const packager = this.createHelper(platform);
      const nameToTarget = new Map();
      platformToTarget.set(platform, nameToTarget);

      for (const [arch, targetNames] of (0, _targetFactory().computeArchToTargetNamesMap)(archToType, packager, platform)) {
        if (this.cancellationToken.cancelled) {
          break;
        }

        await this.installAppDependencies(platform, arch);

        if (this.cancellationToken.cancelled) {
          break;
        } // support os and arch macro in output value


        const outDir = path.resolve(this.projectDir, packager.expandMacro(this._configuration.directories.output, _builderUtil().Arch[arch]));
        const targetList = (0, _targetFactory().createTargets)(nameToTarget, targetNames.length === 0 ? packager.defaultTarget : targetNames, outDir, packager);
        await createOutDirIfNeed(targetList, createdOutDirs);
        await packager.pack(outDir, arch, targetList, taskManager);
      }

      if (this.cancellationToken.cancelled) {
        break;
      }

      for (const target of nameToTarget.values()) {
        taskManager.addTask(target.finishBuild());
      }
    }

    await taskManager.awaitTasks();
    return platformToTarget;
  }

  createHelper(platform) {
    if (this.options.platformPackagerFactory != null) {
      return this.options.platformPackagerFactory(this, platform);
    }

    switch (platform) {
      case _index().Platform.MAC:
        {
          const helperClass = require("./macPackager").default;

          return new helperClass(this);
        }

      case _index().Platform.WINDOWS:
        {
          const helperClass = require("./winPackager").WinPackager;

          return new helperClass(this);
        }

      case _index().Platform.LINUX:
        return new (require("./linuxPackager").LinuxPackager)(this);

      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  async installAppDependencies(platform, arch) {
    if (this.options.prepackaged != null || this.framework.isNpmRebuildRequired !== true) {
      return;
    }

    const frameworkInfo = {
      version: this.framework.version,
      useCustomDist: true
    };
    const config = this.config;

    if (config.nodeGypRebuild === true) {
      _builderUtil().log.info({
        arch: _builderUtil().Arch[arch]
      }, "executing node-gyp rebuild");

      await (0, _builderUtil().exec)(process.platform === "win32" ? "node-gyp.cmd" : "node-gyp", ["rebuild"], {
        env: (0, _yarn().getGypEnv)(frameworkInfo, platform.nodeName, _builderUtil().Arch[arch], true)
      });
    }

    if (config.npmRebuild === false) {
      _builderUtil().log.info({
        reason: "npmRebuild is set to false"
      }, "skipped dependencies rebuild");

      return;
    }

    const beforeBuild = (0, _platformPackager().resolveFunction)(config.beforeBuild, "beforeBuild");

    if (beforeBuild != null) {
      const performDependenciesInstallOrRebuild = await beforeBuild({
        appDir: this.appDir,
        electronVersion: this.config.electronVersion,
        platform,
        arch: _builderUtil().Arch[arch]
      }); // If beforeBuild resolves to false, it means that handling node_modules is done outside of electron-builder.

      this._nodeModulesHandledExternally = !performDependenciesInstallOrRebuild;

      if (!performDependenciesInstallOrRebuild) {
        return;
      }
    }

    if (config.buildDependenciesFromSource === true && platform.nodeName !== process.platform) {
      _builderUtil().log.info({
        reason: "platform is different and buildDependenciesFromSource is set to true"
      }, "skipped dependencies rebuild");
    } else {
      await (0, _yarn().installOrRebuild)(config, this.appDir, {
        frameworkInfo,
        platform: platform.nodeName,
        arch: _builderUtil().Arch[arch],
        productionDeps: this.getNodeDependencyInfo(null)
      });
    }
  }

  async afterPack(context) {
    const afterPack = (0, _platformPackager().resolveFunction)(this.config.afterPack, "afterPack");
    const handlers = this.afterPackHandlers.slice();

    if (afterPack != null) {
      // user handler should be last
      handlers.push(afterPack);
    }

    for (const handler of handlers) {
      await Promise.resolve(handler(context));
    }
  }

}

exports.Packager = Packager;

function createOutDirIfNeed(targetList, createdOutDirs) {
  const ourDirs = new Set();

  for (const target of targetList) {
    // noinspection SuspiciousInstanceOfGuard
    if (target instanceof _targetFactory().NoOpTarget) {
      continue;
    }

    const outDir = target.outDir;

    if (!createdOutDirs.has(outDir)) {
      ourDirs.add(outDir);
    }
  }

  if (ourDirs.size === 0) {
    return Promise.resolve();
  }

  return Promise.all(Array.from(ourDirs).sort().map(dir => {
    return (0, _fsExtra().mkdirs)(dir).then(() => (0, _fsExtra().chmod)(dir, 0o755)
    /* set explicitly */
    ).then(() => createdOutDirs.add(dir));
  }));
}

function getSafeEffectiveConfig(configuration) {
  const o = JSON.parse((0, _builderUtil().safeStringifyJson)(configuration));

  if (o.cscLink != null) {
    o.cscLink = "<hidden by builder>";
  }

  return (0, _builderUtil().serializeToYaml)(o, true);
} 
// __ts-babel@6.0.4
//# sourceMappingURL=packager.js.map