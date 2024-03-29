"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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

function _electronOsxSign() {
  const data = require("../electron-osx-sign");

  _electronOsxSign = function () {
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

function _appInfo() {
  const data = require("./appInfo");

  _appInfo = function () {
    return data;
  };

  return data;
}

function _macCodeSign() {
  const data = require("./codeSign/macCodeSign");

  _macCodeSign = function () {
    return data;
  };

  return data;
}

function _core() {
  const data = require("./core");

  _core = function () {
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

function _ArchiveTarget() {
  const data = require("./targets/ArchiveTarget");

  _ArchiveTarget = function () {
    return data;
  };

  return data;
}

function _pkg() {
  const data = require("./targets/pkg");

  _pkg = function () {
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

function _macosVersion() {
  const data = require("./util/macosVersion");

  _macosVersion = function () {
    return data;
  };

  return data;
}

function _pathManager() {
  const data = require("./util/pathManager");

  _pathManager = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class MacPackager extends _platformPackager().PlatformPackager {
  constructor(info) {
    super(info, _core().Platform.MAC);
    this.codeSigningInfo = new (_lazyVal().Lazy)(() => {
      const cscLink = this.getCscLink();

      if (cscLink == null || process.platform !== "darwin") {
        return Promise.resolve({
          keychainFile: process.env.CSC_KEYCHAIN || null
        });
      }

      return (0, _macCodeSign().createKeychain)({
        tmpDir: this.info.tempDirManager,
        cscLink,
        cscKeyPassword: this.getCscPassword(),
        cscILink: (0, _platformPackager().chooseNotNull)(this.platformSpecificBuildOptions.cscInstallerLink, process.env.CSC_INSTALLER_LINK),
        cscIKeyPassword: (0, _platformPackager().chooseNotNull)(this.platformSpecificBuildOptions.cscInstallerKeyPassword, process.env.CSC_INSTALLER_KEY_PASSWORD),
        currentDir: this.projectDir
      }).then(result => {
        const keychainFile = result.keychainFile;

        if (keychainFile != null) {
          this.info.disposeOnBuildFinish(() => (0, _macCodeSign().removeKeychain)(keychainFile));
        }

        return result;
      });
    });
    this._iconPath = new (_lazyVal().Lazy)(() => this.getOrConvertIcon("icns"));
  }

  get defaultTarget() {
    return this.info.framework.macOsDefaultTargets;
  }

  prepareAppInfo(appInfo) {
    return new (_appInfo().AppInfo)(this.info, this.platformSpecificBuildOptions.bundleVersion, this.platformSpecificBuildOptions);
  }

  async getIconPath() {
    return this._iconPath.value;
  }

  createTargets(targets, mapper) {
    for (const name of targets) {
      switch (name) {
        case _core().DIR_TARGET:
          break;

        case "dmg":
          const {
            DmgTarget
          } = require("dmg-builder");

          mapper(name, outDir => new DmgTarget(this, outDir));
          break;

        case "zip":
          // https://github.com/electron-userland/electron-builder/issues/2313
          mapper(name, outDir => new (_ArchiveTarget().ArchiveTarget)(name, outDir, this, true));
          break;

        case "pkg":
          mapper(name, outDir => new (_pkg().PkgTarget)(this, outDir));
          break;

        default:
          mapper(name, outDir => name === "mas" || name === "mas-dev" ? new (_targetFactory().NoOpTarget)(name) : (0, _targetFactory().createCommonTarget)(name, outDir, this));
          break;
      }
    }
  }

  async pack(outDir, arch, targets, taskManager) {
    let nonMasPromise = null;
    const hasMas = targets.length !== 0 && targets.some(it => it.name === "mas" || it.name === "mas-dev");
    const prepackaged = this.packagerOptions.prepackaged;

    if (!hasMas || targets.length > 1) {
      const appPath = prepackaged == null ? path.join(this.computeAppOutDir(outDir, arch), `${this.appInfo.productFilename}.app`) : prepackaged;
      nonMasPromise = (prepackaged ? Promise.resolve() : this.doPack(outDir, path.dirname(appPath), this.platform.nodeName, arch, this.platformSpecificBuildOptions, targets)).then(() => this.packageInDistributableFormat(appPath, _builderUtil().Arch.x64, targets, taskManager));
    }

    for (const target of targets) {
      const targetName = target.name;

      if (!(targetName === "mas" || targetName === "mas-dev")) {
        continue;
      }

      const masBuildOptions = (0, _builderUtil().deepAssign)({}, this.platformSpecificBuildOptions, this.config.mas);

      if (targetName === "mas-dev") {
        (0, _builderUtil().deepAssign)(masBuildOptions, this.config.masDev, {
          type: "development"
        });
      }

      const targetOutDir = path.join(outDir, targetName);

      if (prepackaged == null) {
        await this.doPack(outDir, targetOutDir, "mas", arch, masBuildOptions, [target]);
        await this.sign(path.join(targetOutDir, `${this.appInfo.productFilename}.app`), targetOutDir, masBuildOptions);
      } else {
        await this.sign(prepackaged, targetOutDir, masBuildOptions);
      }
    }

    if (nonMasPromise != null) {
      await nonMasPromise;
    }
  }

  async sign(appPath, outDir, masOptions) {
    if (!(0, _macCodeSign().isSignAllowed)()) {
      return;
    }

    const isMas = masOptions != null;
    const options = masOptions == null ? this.platformSpecificBuildOptions : masOptions;
    const qualifier = options.identity;

    if (!isMas && qualifier === null) {
      if (this.forceCodeSigning) {
        throw new (_builderUtil().InvalidConfigurationError)("identity explicitly is set to null, but forceCodeSigning is set to true");
      }

      _builderUtil().log.info({
        reason: "identity explicitly is set to null"
      }, "skipped macOS code signing");

      return;
    }

    const keychainFile = (await this.codeSigningInfo.value).keychainFile;
    const explicitType = options.type;
    const type = explicitType || "distribution";
    const isDevelopment = type === "development";
    const certificateType = getCertificateType(isMas, isDevelopment);
    let identity = await (0, _macCodeSign().findIdentity)(certificateType, qualifier, keychainFile);

    if (identity == null) {
      if (!isMas && !isDevelopment && explicitType !== "distribution") {
        identity = await (0, _macCodeSign().findIdentity)("Mac Developer", qualifier, keychainFile);

        if (identity != null) {
          _builderUtil().log.warn("Mac Developer is used to sign app — it is only for development and testing, not for production");
        }
      }

      if (identity == null) {
        await (0, _macCodeSign().reportError)(isMas, certificateType, qualifier, keychainFile, this.forceCodeSigning);
        return;
      }
    }

    if (!(0, _macosVersion().isMacOsHighSierra)()) {
      throw new (_builderUtil().InvalidConfigurationError)("macOS High Sierra 10.13.6 is required to sign");
    }

    const signOptions = {
      "identity-validation": false,
      // https://github.com/electron-userland/electron-builder/issues/1699
      // kext are signed by the chipset manufacturers. You need a special certificate (only available on request) from Apple to be able to sign kext.
      ignore: file => {
        return file.endsWith(".kext") || file.startsWith("/Contents/PlugIns", appPath.length) || // https://github.com/electron-userland/electron-builder/issues/2010
        file.includes("/node_modules/puppeteer/.local-chromium");
      },
      identity: identity,
      type,
      platform: isMas ? "mas" : "darwin",
      version: this.config.electronVersion,
      app: appPath,
      keychain: keychainFile || undefined,
      binaries: options.binaries || undefined,
      requirements: isMas || this.platformSpecificBuildOptions.requirements == null ? undefined : await this.getResource(this.platformSpecificBuildOptions.requirements),
      // https://github.com/electron-userland/electron-osx-sign/issues/196
      // will fail on 10.14.5+ because a signed but unnotarized app is also rejected.
      "gatekeeper-assess": options.gatekeeperAssess === true,
      hardenedRuntime: options.hardenedRuntime !== false
    };
    await this.adjustSignOptions(signOptions, masOptions);

    _builderUtil().log.info({
      file: _builderUtil().log.filePath(appPath),
      identityName: identity.name,
      identityHash: identity.hash,
      provisioningProfile: signOptions["provisioning-profile"] || "none"
    }, "signing");

    await this.doSign(signOptions); // https://github.com/electron-userland/electron-builder/issues/1196#issuecomment-312310209

    if (masOptions != null && !isDevelopment) {
      const certType = isDevelopment ? "Mac Developer" : "3rd Party Mac Developer Installer";
      const masInstallerIdentity = await (0, _macCodeSign().findIdentity)(certType, masOptions.identity, keychainFile);

      if (masInstallerIdentity == null) {
        throw new (_builderUtil().InvalidConfigurationError)(`Cannot find valid "${certType}" identity to sign MAS installer, please see https://electron.build/code-signing`);
      } // mas uploaded to AppStore, so, use "-" instead of space for name


      const artifactName = this.expandArtifactNamePattern(masOptions, "pkg");
      const artifactPath = path.join(outDir, artifactName);
      await this.doFlat(appPath, artifactPath, masInstallerIdentity, keychainFile);
      await this.dispatchArtifactCreated(artifactPath, null, _builderUtil().Arch.x64, this.computeSafeArtifactName(artifactName, "pkg"));
    }
  }

  async adjustSignOptions(signOptions, masOptions) {
    const resourceList = await this.resourceList;
    const customSignOptions = masOptions || this.platformSpecificBuildOptions;
    const entitlementsSuffix = masOptions == null ? "mac" : "mas";
    let entitlements = customSignOptions.entitlements;

    if (entitlements == null) {
      const p = `entitlements.${entitlementsSuffix}.plist`;

      if (resourceList.includes(p)) {
        entitlements = path.join(this.info.buildResourcesDir, p);
      } else {
        entitlements = (0, _pathManager().getTemplatePath)("entitlements.mac.plist");
      }
    }

    signOptions.entitlements = entitlements;
    let entitlementsInherit = customSignOptions.entitlementsInherit;

    if (entitlementsInherit == null) {
      const p = `entitlements.${entitlementsSuffix}.inherit.plist`;

      if (resourceList.includes(p)) {
        entitlementsInherit = path.join(this.info.buildResourcesDir, p);
      } else {
        entitlementsInherit = (0, _pathManager().getTemplatePath)("entitlements.mac.plist");
      }
    }

    signOptions["entitlements-inherit"] = entitlementsInherit;

    if (customSignOptions.provisioningProfile != null) {
      signOptions["provisioning-profile"] = customSignOptions.provisioningProfile;
    }
  } //noinspection JSMethodCanBeStatic


  async doSign(opts) {
    return (0, _electronOsxSign().signAsync)(opts);
  } //noinspection JSMethodCanBeStatic


  async doFlat(appPath, outFile, identity, keychain) {
    // productbuild doesn't created directory for out file
    await (0, _fsExtra().mkdirs)(path.dirname(outFile));
    const args = (0, _pkg().prepareProductBuildArgs)(identity, keychain);
    args.push("--component", appPath, "/Applications");
    args.push(outFile);
    return await (0, _builderUtil().exec)("productbuild", args);
  }

  getElectronSrcDir(dist) {
    return path.resolve(this.projectDir, dist, this.info.framework.distMacOsAppName);
  }

  getElectronDestinationDir(appOutDir) {
    return path.join(appOutDir, this.info.framework.distMacOsAppName);
  } // todo fileAssociations


  async applyCommonInfo(appPlist, contentsPath) {
    const appInfo = this.appInfo;
    const appFilename = appInfo.productFilename; // https://github.com/electron-userland/electron-builder/issues/1278

    appPlist.CFBundleExecutable = appFilename.endsWith(" Helper") ? appFilename.substring(0, appFilename.length - " Helper".length) : appFilename;
    const icon = await this.getIconPath();

    if (icon != null) {
      const oldIcon = appPlist.CFBundleIconFile;
      const resourcesPath = path.join(contentsPath, "Resources");

      if (oldIcon != null) {
        await (0, _fs().unlinkIfExists)(path.join(resourcesPath, oldIcon));
      }

      const iconFileName = `${appFilename}.icns`;
      appPlist.CFBundleIconFile = iconFileName;
      await (0, _fs().copyFile)(icon, path.join(resourcesPath, iconFileName));
    }

    appPlist.CFBundleName = appInfo.productName;
    appPlist.CFBundleDisplayName = appInfo.productName;
    const minimumSystemVersion = this.platformSpecificBuildOptions.minimumSystemVersion;

    if (minimumSystemVersion != null) {
      appPlist.LSMinimumSystemVersion = minimumSystemVersion;
    }

    appPlist.CFBundleIdentifier = appInfo.macBundleIdentifier;
    appPlist.CFBundleShortVersionString = this.platformSpecificBuildOptions.bundleShortVersion || appInfo.version;
    appPlist.CFBundleVersion = appInfo.buildVersion;
    (0, _builderUtil().use)(this.platformSpecificBuildOptions.category || this.config.category, it => appPlist.LSApplicationCategoryType = it);
    appPlist.NSHumanReadableCopyright = appInfo.copyright;

    if (this.platformSpecificBuildOptions.darkModeSupport) {
      appPlist.NSRequiresAquaSystemAppearance = false;
    }

    const extendInfo = this.platformSpecificBuildOptions.extendInfo;

    if (extendInfo != null) {
      Object.assign(appPlist, extendInfo);
    }
  }

  async signApp(packContext, isAsar) {
    const appFileName = `${this.appInfo.productFilename}.app`;
    await _bluebirdLst().default.map((0, _fsExtra().readdir)(packContext.appOutDir), file => {
      if (file === appFileName) {
        return this.sign(path.join(packContext.appOutDir, file), null, null);
      }

      return null;
    });

    if (!isAsar) {
      return;
    }

    const outResourcesDir = path.join(packContext.appOutDir, "resources", "app.asar.unpacked");
    await _bluebirdLst().default.map((0, _promise().orIfFileNotExist)((0, _fsExtra().readdir)(outResourcesDir), []), file => {
      if (file.endsWith(".app")) {
        return this.sign(path.join(outResourcesDir, file), null, null);
      } else {
        return null;
      }
    });
  }

}

exports.default = MacPackager;

function getCertificateType(isMas, isDevelopment) {
  if (isDevelopment) {
    return "Mac Developer";
  }

  return isMas ? "3rd Party Mac Developer Application" : "Developer ID Application";
} 
// __ts-babel@6.0.4
//# sourceMappingURL=macPackager.js.map