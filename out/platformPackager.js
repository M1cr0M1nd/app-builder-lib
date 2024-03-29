"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isSafeGithubName = isSafeGithubName;
exports.computeSafeArtifactNameIfNeeded = computeSafeArtifactNameIfNeeded;
exports.normalizeExt = normalizeExt;
exports.resolveFunction = resolveFunction;
exports.chooseNotNull = chooseNotNull;
exports.isSafeToUnpackElectronOnRemoteBuildServer = isSafeToUnpackElectronOnRemoteBuildServer;
exports.PlatformPackager = void 0;

function _bluebirdLst() {
  const data = _interopRequireDefault(require("bluebird-lst"));

  _bluebirdLst = function () {
    return data;
  };

  return data;
}

function _builderUtil() {
  const data = require("builder-util");

  _builderUtil = function () {
    return data;
  };

  return data;
}

function _arch() {
  const data = require("builder-util/out/arch");

  _arch = function () {
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

function _promise() {
  const data = require("builder-util/out/promise");

  _promise = function () {
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

function _appInfo() {
  const data = require("./appInfo");

  _appInfo = function () {
    return data;
  };

  return data;
}

function _asarFileChecker() {
  const data = require("./asar/asarFileChecker");

  _asarFileChecker = function () {
    return data;
  };

  return data;
}

function _asarUtil() {
  const data = require("./asar/asarUtil");

  _asarUtil = function () {
    return data;
  };

  return data;
}

function _integrity() {
  const data = require("./asar/integrity");

  _integrity = function () {
    return data;
  };

  return data;
}

function _fileMatcher() {
  const data = require("./fileMatcher");

  _fileMatcher = function () {
    return data;
  };

  return data;
}

function _fileTransformer() {
  const data = require("./fileTransformer");

  _fileTransformer = function () {
    return data;
  };

  return data;
}

function _Framework() {
  const data = require("./Framework");

  _Framework = function () {
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

function _appBuilder() {
  const data = require("./util/appBuilder");

  _appBuilder = function () {
    return data;
  };

  return data;
}

function _appFileCopier() {
  const data = require("./util/appFileCopier");

  _appFileCopier = function () {
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

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PlatformPackager {
  constructor(info, platform) {
    this.info = info;
    this.platform = platform;
    this._resourceList = new (_lazyVal().Lazy)(() => (0, _promise().orIfFileNotExist)((0, _fsExtra().readdir)(this.info.buildResourcesDir), []));
    this.platformSpecificBuildOptions = PlatformPackager.normalizePlatformSpecificBuildOptions(this.config[platform.buildConfigurationKey]);
    this.appInfo = this.prepareAppInfo(info.appInfo);
  }

  get packagerOptions() {
    return this.info.options;
  }

  get buildResourcesDir() {
    return this.info.buildResourcesDir;
  }

  get projectDir() {
    return this.info.projectDir;
  }

  get config() {
    return this.info.config;
  }

  get resourceList() {
    return this._resourceList.value;
  }

  get compression() {
    const compression = this.platformSpecificBuildOptions.compression; // explicitly set to null - request to use default value instead of parent (in the config)

    if (compression === null) {
      return "normal";
    }

    return compression || this.config.compression || "normal";
  }

  get debugLogger() {
    return this.info.debugLogger;
  }

  prepareAppInfo(appInfo) {
    return new (_appInfo().AppInfo)(this.info, null, this.platformSpecificBuildOptions);
  }

  static normalizePlatformSpecificBuildOptions(options) {
    return options == null ? Object.create(null) : options;
  }

  getCscPassword() {
    const password = this.doGetCscPassword();

    if ((0, _builderUtil().isEmptyOrSpaces)(password)) {
      _builderUtil().log.info({
        reason: "CSC_KEY_PASSWORD is not defined"
      }, "empty password will be used for code signing");

      return "";
    } else {
      return password.trim();
    }
  }

  getCscLink(extraEnvName) {
    // allow to specify as empty string
    const envValue = chooseNotNull(extraEnvName == null ? null : process.env[extraEnvName], process.env.CSC_LINK);
    return chooseNotNull(chooseNotNull(this.info.config.cscLink, this.platformSpecificBuildOptions.cscLink), envValue);
  }

  doGetCscPassword() {
    // allow to specify as empty string
    return chooseNotNull(chooseNotNull(this.info.config.cscKeyPassword, this.platformSpecificBuildOptions.cscKeyPassword), process.env.CSC_KEY_PASSWORD);
  }

  computeAppOutDir(outDir, arch) {
    return this.packagerOptions.prepackaged || path.join(outDir, `${this.platform.buildConfigurationKey}${(0, _builderUtil().getArchSuffix)(arch)}${this.platform === _index().Platform.MAC ? "" : "-unpacked"}`);
  }

  dispatchArtifactCreated(file, target, arch, safeArtifactName) {
    return this.info.callArtifactBuildCompleted({
      file,
      safeArtifactName,
      target,
      arch,
      packager: this
    });
  }

  async pack(outDir, arch, targets, taskManager) {
    const appOutDir = this.computeAppOutDir(outDir, arch);
    await this.doPack(outDir, appOutDir, this.platform.nodeName, arch, this.platformSpecificBuildOptions, targets);
    this.packageInDistributableFormat(appOutDir, arch, targets, taskManager);
  }

  packageInDistributableFormat(appOutDir, arch, targets, taskManager) {
    if (targets.find(it => !it.isAsyncSupported) == null) {
      PlatformPackager.buildAsyncTargets(targets, taskManager, appOutDir, arch);
      return;
    }

    taskManager.add(async () => {
      // BluebirdPromise.map doesn't invoke target.build immediately, but for RemoteTarget it is very critical to call build() before finishBuild()
      const subTaskManager = new (_builderUtil().AsyncTaskManager)(this.info.cancellationToken);
      PlatformPackager.buildAsyncTargets(targets, subTaskManager, appOutDir, arch);
      await subTaskManager.awaitTasks();

      for (const target of targets) {
        if (!target.isAsyncSupported) {
          await target.build(appOutDir, arch);
        }
      }
    });
  }

  static buildAsyncTargets(targets, taskManager, appOutDir, arch) {
    for (const target of targets) {
      if (target.isAsyncSupported) {
        taskManager.addTask(target.build(appOutDir, arch));
      }
    }
  }

  getExtraFileMatchers(isResources, appOutDir, options) {
    const base = isResources ? this.getResourcesDir(appOutDir) : this.platform === _index().Platform.MAC ? path.join(appOutDir, `${this.appInfo.productFilename}.app`, "Contents") : appOutDir;
    return (0, _fileMatcher().getFileMatchers)(this.config, isResources ? "extraResources" : "extraFiles", base, options);
  }

  createGetFileMatchersOptions(outDir, arch, customBuildOptions) {
    return {
      macroExpander: it => this.expandMacro(it, arch == null ? null : _builderUtil().Arch[arch], {
        "/*": "{,/**/*}"
      }),
      customBuildOptions,
      globalOutDir: outDir,
      defaultSrc: this.projectDir
    };
  }

  async doPack(outDir, appOutDir, platformName, arch, platformSpecificBuildOptions, targets) {
    if (this.packagerOptions.prepackaged != null) {
      return;
    }

    const framework = this.info.framework;

    _builderUtil().log.info({
      platform: platformName,
      arch: _builderUtil().Arch[arch],
      [`${framework.name}`]: framework.version,
      appOutDir: _builderUtil().log.filePath(appOutDir)
    }, `packaging`);

    await framework.prepareApplicationStageDirectory({
      packager: this,
      appOutDir,
      platformName,
      arch: _builderUtil().Arch[arch],
      version: framework.version
    });
    const excludePatterns = [];

    const computeParsedPatterns = patterns => {
      if (patterns != null) {
        for (const pattern of patterns) {
          pattern.computeParsedPatterns(excludePatterns, this.info.projectDir);
        }
      }
    };

    const getFileMatchersOptions = this.createGetFileMatchersOptions(outDir, arch, platformSpecificBuildOptions);
    const macroExpander = getFileMatchersOptions.macroExpander;
    const extraResourceMatchers = this.getExtraFileMatchers(true, appOutDir, getFileMatchersOptions);
    computeParsedPatterns(extraResourceMatchers);
    const extraFileMatchers = this.getExtraFileMatchers(false, appOutDir, getFileMatchersOptions);
    computeParsedPatterns(extraFileMatchers);
    const packContext = {
      appOutDir,
      outDir,
      arch,
      targets,
      packager: this,
      electronPlatformName: platformName
    };
    const asarOptions = await this.computeAsarOptions(platformSpecificBuildOptions);
    const resourcesPath = this.platform === _index().Platform.MAC ? path.join(appOutDir, framework.distMacOsAppName, "Contents", "Resources") : (0, _Framework().isElectronBased)(framework) ? path.join(appOutDir, "resources") : appOutDir;
    const taskManager = new (_builderUtil().AsyncTaskManager)(this.info.cancellationToken);
    this.copyAppFiles(taskManager, asarOptions, resourcesPath, path.join(resourcesPath, "app"), packContext, platformSpecificBuildOptions, excludePatterns, macroExpander);
    await taskManager.awaitTasks();

    if (this.info.cancellationToken.cancelled) {
      return;
    }

    if (framework.beforeCopyExtraFiles != null) {
      await framework.beforeCopyExtraFiles({
        packager: this,
        appOutDir,
        asarIntegrity: asarOptions == null ? null : await (0, _integrity().computeData)(resourcesPath, asarOptions.externalAllowed ? {
          externalAllowed: true
        } : null),
        platformName
      });
    }

    if (this.info.cancellationToken.cancelled) {
      return;
    }

    const transformerForExtraFiles = this.createTransformerForExtraFiles(packContext);
    await (0, _fileMatcher().copyFiles)(extraResourceMatchers, transformerForExtraFiles);
    await (0, _fileMatcher().copyFiles)(extraFileMatchers, transformerForExtraFiles);

    if (this.info.cancellationToken.cancelled) {
      return;
    }

    await this.info.afterPack(packContext);

    if (framework.afterPack != null) {
      await framework.afterPack(packContext);
    }

    const isAsar = asarOptions != null;
    await this.sanityCheckPackage(appOutDir, isAsar, framework);
    await this.signApp(packContext, isAsar);
    const afterSign = resolveFunction(this.config.afterSign, "afterSign");

    if (afterSign != null) {
      await Promise.resolve(afterSign(packContext));
    }
  }

  createTransformerForExtraFiles(packContext) {
    return null;
  }

  copyAppFiles(taskManager, asarOptions, resourcePath, defaultDestination, packContext, platformSpecificBuildOptions, excludePatterns, macroExpander) {
    const appDir = this.info.appDir;
    const config = this.config;
    const isElectronCompile = asarOptions != null && (0, _fileTransformer().isElectronCompileUsed)(this.info);
    const mainMatchers = (0, _fileMatcher().getMainFileMatchers)(appDir, defaultDestination, macroExpander, platformSpecificBuildOptions, this, packContext.outDir, isElectronCompile);

    if (excludePatterns.length > 0) {
      for (const matcher of mainMatchers) {
        matcher.excludePatterns = excludePatterns;
      }
    }

    const framework = this.info.framework;
    const transformer = (0, _fileTransformer().createTransformer)(appDir, config, isElectronCompile ? Object.assign({
      originalMain: this.info.metadata.main,
      main: _appFileCopier().ELECTRON_COMPILE_SHIM_FILENAME
    }, config.extraMetadata) : config.extraMetadata, framework.createTransformer == null ? null : framework.createTransformer());

    const _computeFileSets = matchers => {
      return (0, _appFileCopier().computeFileSets)(matchers, this.info.isPrepackedAppAsar ? null : transformer, this, isElectronCompile).then(async result => {
        if (!this.info.isPrepackedAppAsar && !this.info.areNodeModulesHandledExternally) {
          const moduleFileMatcher = (0, _fileMatcher().getNodeModuleFileMatcher)(appDir, defaultDestination, macroExpander, platformSpecificBuildOptions, this.info);
          result = result.concat((await (0, _appFileCopier().computeNodeModuleFileSets)(this, moduleFileMatcher)));
        }

        return result.filter(it => it.files.length > 0);
      });
    };

    if (this.info.isPrepackedAppAsar) {
      taskManager.addTask(_bluebirdLst().default.each(_computeFileSets([new (_fileMatcher().FileMatcher)(appDir, resourcePath, macroExpander)]), it => (0, _appFileCopier().copyAppFiles)(it, this.info, transformer)));
    } else if (asarOptions == null) {
      // for ASAR all asar unpacked files will be extra transformed (e.g. sign of EXE and DLL) later,
      // for prepackaged asar extra transformation not supported yet,
      // so, extra transform if asar is disabled
      const transformerForExtraFiles = this.createTransformerForExtraFiles(packContext);

      const combinedTransformer = file => {
        if (transformerForExtraFiles != null) {
          const result = transformerForExtraFiles(file);

          if (result != null) {
            return result;
          }
        }

        return transformer(file);
      };

      taskManager.addTask(_bluebirdLst().default.each(_computeFileSets(mainMatchers), it => (0, _appFileCopier().copyAppFiles)(it, this.info, combinedTransformer)));
    } else {
      const unpackPattern = (0, _fileMatcher().getFileMatchers)(config, "asarUnpack", defaultDestination, {
        macroExpander,
        customBuildOptions: platformSpecificBuildOptions,
        globalOutDir: packContext.outDir,
        defaultSrc: appDir
      });
      const fileMatcher = unpackPattern == null ? null : unpackPattern[0];
      taskManager.addTask(_computeFileSets(mainMatchers).then(async fileSets => {
        for (const fileSet of fileSets) {
          await (0, _appFileCopier().transformFiles)(transformer, fileSet);
        }

        await new (_asarUtil().AsarPackager)(appDir, resourcePath, asarOptions, fileMatcher == null ? null : fileMatcher.createFilter()).pack(fileSets, this);
      }));
    }
  }

  signApp(packContext, isAsar) {
    return Promise.resolve();
  }

  async getIconPath() {
    return null;
  }

  async computeAsarOptions(customBuildOptions) {
    if (!(0, _Framework().isElectronBased)(this.info.framework)) {
      return null;
    }

    function errorMessage(name) {
      return `${name} is deprecated is deprecated and not supported — please use asarUnpack`;
    }

    const buildMetadata = this.config;

    if (buildMetadata["asar-unpack"] != null) {
      throw new Error(errorMessage("asar-unpack"));
    }

    if (buildMetadata["asar-unpack-dir"] != null) {
      throw new Error(errorMessage("asar-unpack-dir"));
    }

    const platformSpecific = customBuildOptions.asar;
    const result = platformSpecific == null ? this.config.asar : platformSpecific;

    if (result === false) {
      const appAsarStat = await (0, _fs().statOrNull)(path.join(this.info.appDir, "app.asar")); //noinspection ES6MissingAwait

      if (appAsarStat == null || !appAsarStat.isFile()) {
        _builderUtil().log.warn({
          solution: "enable asar and use asarUnpack to unpack files that must be externally available"
        }, "asar using is disabled — it is strongly not recommended");
      }

      return null;
    }

    if (result == null || result === true) {
      return {};
    }

    for (const name of ["unpackDir", "unpack"]) {
      if (result[name] != null) {
        throw new Error(errorMessage(`asar.${name}`));
      }
    }

    return (0, _builderUtil().deepAssign)({}, result);
  }

  getElectronSrcDir(dist) {
    return path.resolve(this.projectDir, dist);
  }

  getElectronDestinationDir(appOutDir) {
    return appOutDir;
  }

  getResourcesDir(appOutDir) {
    if (this.platform === _index().Platform.MAC) {
      return this.getMacOsResourcesDir(appOutDir);
    } else if ((0, _Framework().isElectronBased)(this.info.framework)) {
      return path.join(appOutDir, "resources");
    } else {
      return appOutDir;
    }
  }

  getMacOsResourcesDir(appOutDir) {
    return path.join(appOutDir, `${this.appInfo.productFilename}.app`, "Contents", "Resources");
  }

  async checkFileInPackage(resourcesDir, file, messagePrefix, isAsar) {
    const relativeFile = path.relative(this.info.appDir, path.resolve(this.info.appDir, file));

    if (isAsar) {
      await (0, _asarFileChecker().checkFileInArchive)(path.join(resourcesDir, "app.asar"), relativeFile, messagePrefix);
      return;
    }

    const pathParsed = path.parse(file); // Even when packaging to asar is disabled, it does not imply that the main file can not be inside an .asar archive.
    // This may occur when the packaging is done manually before processing with electron-builder.

    if (pathParsed.dir.includes(".asar")) {
      // The path needs to be split to the part with an asar archive which acts like a directory and the part with
      // the path to main file itself. (e.g. path/arch.asar/dir/index.js -> path/arch.asar, dir/index.js)
      // noinspection TypeScriptValidateJSTypes
      const pathSplit = pathParsed.dir.split(path.sep);
      let partWithAsarIndex = 0;
      pathSplit.some((pathPart, index) => {
        partWithAsarIndex = index;
        return pathPart.endsWith(".asar");
      });
      const asarPath = path.join.apply(path, pathSplit.slice(0, partWithAsarIndex + 1));
      let mainPath = pathSplit.length > partWithAsarIndex + 1 ? path.join.apply(pathSplit.slice(partWithAsarIndex + 1)) : "";
      mainPath += path.join(mainPath, pathParsed.base);
      await (0, _asarFileChecker().checkFileInArchive)(path.join(resourcesDir, "app", asarPath), mainPath, messagePrefix);
    } else {
      const fullPath = path.join(resourcesDir, "app", relativeFile);
      const outStat = await (0, _fs().statOrNull)(fullPath);

      if (outStat == null) {
        throw new Error(`${messagePrefix} "${fullPath}" does not exist. Seems like a wrong configuration.`);
      } else {
        //noinspection ES6MissingAwait
        if (!outStat.isFile()) {
          throw new Error(`${messagePrefix} "${fullPath}" is not a file. Seems like a wrong configuration.`);
        }
      }
    }
  }

  async sanityCheckPackage(appOutDir, isAsar, framework) {
    const outStat = await (0, _fs().statOrNull)(appOutDir);

    if (outStat == null) {
      throw new Error(`Output directory "${appOutDir}" does not exist. Seems like a wrong configuration.`);
    } else {
      //noinspection ES6MissingAwait
      if (!outStat.isDirectory()) {
        throw new Error(`Output directory "${appOutDir}" is not a directory. Seems like a wrong configuration.`);
      }
    }

    const resourcesDir = this.getResourcesDir(appOutDir);
    const mainFile = (framework.getMainFile == null ? null : framework.getMainFile(this.platform)) || this.info.metadata.main || "index.js";
    await this.checkFileInPackage(resourcesDir, mainFile, "Application entry file", isAsar);
    await this.checkFileInPackage(resourcesDir, "package.json", "Application", isAsar);
  } // tslint:disable-next-line:no-invalid-template-strings


  computeSafeArtifactName(suggestedName, ext, arch, skipArchIfX64 = true, safePattern = "${name}-${version}-${arch}.${ext}") {
    return computeSafeArtifactNameIfNeeded(suggestedName, () => this.computeArtifactName(safePattern, ext, skipArchIfX64 && arch === _builderUtil().Arch.x64 ? null : arch));
  }

  expandArtifactNamePattern(targetSpecificOptions, ext, arch, defaultPattern, skipArchIfX64 = true) {
    let pattern = targetSpecificOptions == null ? null : targetSpecificOptions.artifactName;

    if (pattern == null) {
      pattern = this.platformSpecificBuildOptions.artifactName || this.config.artifactName;
    }

    if (pattern == null) {
      // tslint:disable-next-line:no-invalid-template-strings
      pattern = defaultPattern || "${productName}-${version}-${arch}.${ext}";
    } else {
      // https://github.com/electron-userland/electron-builder/issues/3510
      // always respect arch in user custom artifact pattern
      skipArchIfX64 = false;
    }

    return this.computeArtifactName(pattern, ext, skipArchIfX64 && arch === _builderUtil().Arch.x64 ? null : arch);
  }

  expandArtifactBeautyNamePattern(targetSpecificOptions, ext, arch) {
    // tslint:disable-next-line:no-invalid-template-strings
    return this.expandArtifactNamePattern(targetSpecificOptions, ext, arch, "${productName} ${version} ${arch}.${ext}", true);
  }

  computeArtifactName(pattern, ext, arch) {
    const archName = arch == null ? null : (0, _arch().getArtifactArchName)(arch, ext);
    return this.expandMacro(pattern, this.platform === _index().Platform.MAC ? null : archName, {
      ext
    });
  }

  expandMacro(pattern, arch, extra = {}, isProductNameSanitized = true) {
    return (0, _macroExpander().expandMacro)(pattern, arch, this.appInfo, Object.assign({
      os: this.platform.buildConfigurationKey
    }, extra), isProductNameSanitized);
  }

  generateName2(ext, classifier, deployment) {
    const dotExt = ext == null ? "" : `.${ext}`;
    const separator = ext === "deb" ? "_" : "-";
    return `${deployment ? this.appInfo.name : this.appInfo.productFilename}${separator}${this.appInfo.version}${classifier == null ? "" : `${separator}${classifier}`}${dotExt}`;
  }

  getTempFile(suffix) {
    return this.info.tempDirManager.getTempFile({
      suffix
    });
  }

  get fileAssociations() {
    return (0, _builderUtil().asArray)(this.config.fileAssociations).concat((0, _builderUtil().asArray)(this.platformSpecificBuildOptions.fileAssociations));
  }

  async getResource(custom, ...names) {
    const resourcesDir = this.info.buildResourcesDir;

    if (custom === undefined) {
      const resourceList = await this.resourceList;

      for (const name of names) {
        if (resourceList.includes(name)) {
          return path.join(resourcesDir, name);
        }
      }
    } else if (custom != null && !(0, _builderUtil().isEmptyOrSpaces)(custom)) {
      const resourceList = await this.resourceList;

      if (resourceList.includes(custom)) {
        return path.join(resourcesDir, custom);
      }

      let p = path.resolve(resourcesDir, custom);

      if ((await (0, _fs().statOrNull)(p)) == null) {
        p = path.resolve(this.projectDir, custom);

        if ((await (0, _fs().statOrNull)(p)) == null) {
          throw new (_builderUtil().InvalidConfigurationError)(`cannot find specified resource "${custom}", nor relative to "${resourcesDir}", neither relative to project dir ("${this.projectDir}")`);
        }
      }

      return p;
    }

    return null;
  }

  get forceCodeSigning() {
    const forceCodeSigningPlatform = this.platformSpecificBuildOptions.forceCodeSigning;
    return (forceCodeSigningPlatform == null ? this.config.forceCodeSigning : forceCodeSigningPlatform) || false;
  }

  async getOrConvertIcon(format) {
    const result = await this.resolveIcon((0, _builderUtil().asArray)(this.platformSpecificBuildOptions.icon || this.config.icon), [], format);

    if (result.length === 0) {
      const framework = this.info.framework;

      if (framework.getDefaultIcon != null) {
        return framework.getDefaultIcon(this.platform);
      }

      _builderUtil().log.warn({
        reason: "application icon is not set"
      }, `default ${capitalizeFirstLetter(framework.name)} icon is used`);

      return this.getDefaultFrameworkIcon();
    } else {
      return result[0].file;
    }
  }

  getDefaultFrameworkIcon() {
    const framework = this.info.framework;
    return framework.getDefaultIcon == null ? null : framework.getDefaultIcon(this.platform);
  } // convert if need, validate size (it is a reason why tool is called even if file has target extension (already specified as foo.icns for example))


  async resolveIcon(sources, fallbackSources, outputFormat) {
    const args = ["icon", "--format", outputFormat, "--root", this.buildResourcesDir, "--root", this.projectDir, "--out", path.resolve(this.projectDir, this.config.directories.output, `.icon-${outputFormat}`)];

    for (const source of sources) {
      args.push("--input", source);
    }

    for (const source of fallbackSources) {
      args.push("--fallback-input", source);
    }

    const result = await (0, _appBuilder().executeAppBuilderAsJson)(args);
    const errorMessage = result.error;

    if (errorMessage != null) {
      throw new (_builderUtil().InvalidConfigurationError)(errorMessage, result.errorCode);
    }

    if (result.isFallback) {
      _builderUtil().log.warn({
        reason: "application icon is not set"
      }, `default ${capitalizeFirstLetter(this.info.framework.name)} icon is used`);
    }

    return result.icons || [];
  }

}

exports.PlatformPackager = PlatformPackager;

function isSafeGithubName(name) {
  return /^[0-9A-Za-z._-]+$/.test(name);
}

function computeSafeArtifactNameIfNeeded(suggestedName, safeNameProducer) {
  // GitHub only allows the listed characters in file names.
  if (suggestedName != null) {
    if (isSafeGithubName(suggestedName)) {
      return null;
    } // prefer to use suggested name - so, if space is the only problem, just replace only space to dash


    suggestedName = suggestedName.replace(/ /g, "-");

    if (isSafeGithubName(suggestedName)) {
      return suggestedName;
    }
  }

  return safeNameProducer();
} // remove leading dot


function normalizeExt(ext) {
  return ext.startsWith(".") ? ext.substring(1) : ext;
}

function resolveFunction(executor, name) {
  if (executor == null || typeof executor !== "string") {
    return executor;
  }

  let p = executor;

  if (p.startsWith(".")) {
    p = path.resolve(p);
  }

  try {
    p = require.resolve(p);
  } catch (e) {
    (0, _builderUtil().debug)(e);
    p = path.resolve(p);
  }

  const m = require(p);

  const namedExport = m[name];

  if (namedExport == null) {
    return m.default || m;
  } else {
    return namedExport;
  }
}

function chooseNotNull(v1, v2) {
  return v1 == null ? v2 : v1;
}

function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isSafeToUnpackElectronOnRemoteBuildServer(packager) {
  if (packager.platform !== _index().Platform.LINUX || packager.config.remoteBuild === false) {
    return false;
  }

  if (process.platform === "win32" || (0, _builderUtil().isEnvTrue)(process.env._REMOTE_BUILD)) {
    return packager.config.electronDist == null && packager.config.electronDownload == null;
  }

  return false;
} 
// __ts-babel@6.0.4
//# sourceMappingURL=platformPackager.js.map