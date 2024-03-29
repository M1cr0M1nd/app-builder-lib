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

function _builderUtilRuntime() {
  const data = require("builder-util-runtime");

  _builderUtilRuntime = function () {
    return data;
  };

  return data;
}

function _binDownload() {
  const data = require("../binDownload");

  _binDownload = function () {
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

function _crypto() {
  const data = require("crypto");

  _crypto = function () {
    return data;
  };

  return data;
}

function ejs() {
  const data = _interopRequireWildcard(require("ejs"));

  ejs = function () {
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

function _core() {
  const data = require("../core");

  _core = function () {
    return data;
  };

  return data;
}

function _CommonWindowsInstallerConfiguration() {
  const data = require("../options/CommonWindowsInstallerConfiguration");

  _CommonWindowsInstallerConfiguration = function () {
    return data;
  };

  return data;
}

function _pathManager() {
  const data = require("../util/pathManager");

  _pathManager = function () {
    return data;
  };

  return data;
}

function _vm() {
  const data = require("../vm/vm");

  _vm = function () {
    return data;
  };

  return data;
}

function _WineVm() {
  const data = require("../vm/WineVm");

  _WineVm = function () {
    return data;
  };

  return data;
}

function _targetUtil() {
  const data = require("./targetUtil");

  _targetUtil = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ELECTRON_BUILDER_UPGRADE_CODE_NS_UUID = _builderUtilRuntime().UUID.parse("d752fe43-5d44-44d5-9fc9-6dd1bf19d5cc");

const ROOT_DIR_ID = "APPLICATIONFOLDER";
const ASSISTED_UI_FILE_NAME = "WixUI_Assisted.wxs";
const projectTemplate = new (_lazyVal().Lazy)(async () => {
  const template = (await (0, _fsExtra().readFile)(path.join((0, _pathManager().getTemplatePath)("msi"), "template.xml"), "utf8")).replace(/{{/g, "<%").replace(/}}/g, "%>").replace(/\${([^}]+)}/g, "<%=$1%>");
  return ejs().compile(template);
}); // WiX doesn't support Mono, so, dontnet462 is required to be installed for wine (preinstalled in our bundled wine)

class MsiTarget extends _core().Target {
  constructor(packager, outDir) {
    super("msi");
    this.packager = packager;
    this.outDir = outDir;
    this.vm = process.platform === "win32" ? new (_vm().VmManager)() : new (_WineVm().WineVmManager)();
    this.options = (0, _builderUtil().deepAssign)(this.packager.platformSpecificBuildOptions, this.packager.config.msi);
  }

  async build(appOutDir, arch) {
    const packager = this.packager;
    const artifactName = packager.expandArtifactBeautyNamePattern(this.options, "msi", arch);
    const artifactPath = path.join(this.outDir, artifactName);
    await packager.info.callArtifactBuildStarted({
      targetPresentableName: "MSI",
      file: artifactPath,
      arch
    });
    const stageDir = await (0, _targetUtil().createStageDir)(this, packager, arch);
    const vm = this.vm;
    const commonOptions = (0, _CommonWindowsInstallerConfiguration().getEffectiveOptions)(this.options, this.packager);

    if (commonOptions.isAssisted) {
      // F*** *** ***  ***  ***  ***  ***  ***  ***  ***  ***  ***  *** WiX  ***  ***  ***  ***  ***  ***  ***  ***  ***
      // cannot understand how to set MSIINSTALLPERUSER on radio box change. In any case installed per user.
      _builderUtil().log.warn(`MSI DOESN'T SUPPORT assisted installer. Please use NSIS instead.`);
    }

    const projectFile = stageDir.getTempFile("project.wxs");
    const objectFiles = ["project.wixobj"];
    const uiFile = commonOptions.isAssisted ? stageDir.getTempFile(ASSISTED_UI_FILE_NAME) : null;
    await (0, _fsExtra().writeFile)(projectFile, (await this.writeManifest(appOutDir, arch, commonOptions)));

    if (uiFile !== null) {
      await (0, _fsExtra().writeFile)(uiFile, (await (0, _fsExtra().readFile)(path.join((0, _pathManager().getTemplatePath)("msi"), ASSISTED_UI_FILE_NAME), "utf8")));
      objectFiles.push(ASSISTED_UI_FILE_NAME.replace(".wxs", ".wixobj"));
    } // noinspection SpellCheckingInspection


    const vendorPath = await (0, _binDownload().getBinFromUrl)("wix", "4.0.0.5512.2", "/X5poahdCc3199Vt6AP7gluTlT1nxi9cbbHhZhCMEu+ngyP1LiBMn+oZX7QAZVaKeBMc2SjVp7fJqNLqsUnPNQ=="); // noinspection SpellCheckingInspection

    const candleArgs = ["-arch", arch === _builderUtil().Arch.ia32 ? "x86" : arch === _builderUtil().Arch.arm64 ? "arm64" : "x64", `-dappDir=${vm.toVmFile(appOutDir)}`].concat(this.getCommonWixArgs());
    candleArgs.push("project.wxs");

    if (uiFile !== null) {
      candleArgs.push(ASSISTED_UI_FILE_NAME);
    }

    await vm.exec(vm.toVmFile(path.join(vendorPath, "candle.exe")), candleArgs, {
      cwd: stageDir.dir
    });
    await this.light(objectFiles, vm, artifactPath, appOutDir, vendorPath, stageDir.dir);
    await stageDir.cleanup();
    await packager.sign(artifactPath);
    await packager.info.callArtifactBuildCompleted({
      file: artifactPath,
      packager,
      arch,
      safeArtifactName: packager.computeSafeArtifactName(artifactName, "msi"),
      target: this,
      isWriteUpdateInfo: false
    });
  }

  async light(objectFiles, vm, artifactPath, appOutDir, vendorPath, tempDir) {
    // noinspection SpellCheckingInspection
    const lightArgs = ["-out", vm.toVmFile(artifactPath), "-v", // https://github.com/wixtoolset/issues/issues/5169
    "-spdb", // https://sourceforge.net/p/wix/bugs/2405/
    // error LGHT1076 : ICE61: This product should remove only older versions of itself. The Maximum version is not less than the current product. (1.1.0.42 1.1.0.42)
    "-sw1076", `-dappDir=${vm.toVmFile(appOutDir)}`].concat(this.getCommonWixArgs()); // http://windows-installer-xml-wix-toolset.687559.n2.nabble.com/Build-3-5-2229-0-give-me-the-following-error-error-LGHT0216-An-unexpected-Win32-exception-with-errorn-td5707443.html

    if (process.platform !== "win32") {
      // noinspection SpellCheckingInspection
      lightArgs.push("-sval");
    }

    if (this.options.oneClick === false) {
      lightArgs.push("-ext", "WixUIExtension");
    } // objectFiles - only filenames, we set current directory to our temp stage dir


    lightArgs.push(...objectFiles);
    await vm.exec(vm.toVmFile(path.join(vendorPath, "light.exe")), lightArgs, {
      cwd: tempDir
    });
  }

  getCommonWixArgs() {
    const args = ["-pedantic"];

    if (this.options.warningsAsErrors !== false) {
      args.push("-wx");
    }

    return args;
  }

  async writeManifest(appOutDir, arch, commonOptions) {
    const appInfo = this.packager.appInfo;
    const {
      files,
      dirs
    } = await this.computeFileDeclaration(appOutDir);
    const companyName = appInfo.companyName;

    if (!companyName) {
      _builderUtil().log.warn(`Manufacturer is not set for MSI — please set "author" in the package.json`);
    }

    const compression = this.packager.compression;
    const options = this.options;
    const iconPath = await this.packager.getIconPath();
    return (await projectTemplate.value)(Object.assign(Object.assign({}, commonOptions), {
      isCreateDesktopShortcut: commonOptions.isCreateDesktopShortcut !== _CommonWindowsInstallerConfiguration().DesktopShortcutCreationPolicy.NEVER,
      isRunAfterFinish: options.runAfterFinish !== false,
      iconPath: iconPath == null ? null : this.vm.toVmFile(iconPath),
      compressionLevel: compression === "store" ? "none" : "high",
      version: appInfo.getVersionInWeirdWindowsForm(),
      productName: appInfo.productName,
      upgradeCode: (options.upgradeCode || _builderUtilRuntime().UUID.v5(appInfo.id, ELECTRON_BUILDER_UPGRADE_CODE_NS_UUID)).toUpperCase(),
      manufacturer: companyName || appInfo.productName,
      appDescription: appInfo.description,
      // https://stackoverflow.com/questions/1929038/compilation-error-ice80-the-64bitcomponent-uses-32bitdirectory
      programFilesId: arch === _builderUtil().Arch.x64 ? "ProgramFiles64Folder" : "ProgramFilesFolder",
      // wix in the name because special wix format can be used in the name
      installationDirectoryWixName: (0, _targetUtil().getWindowsInstallationDirName)(appInfo, commonOptions.isPerMachine === true),
      dirs,
      files
    }));
  }

  async computeFileDeclaration(appOutDir) {
    const appInfo = this.packager.appInfo;
    let isRootDirAddedToRemoveTable = false;
    const dirNames = new Set();
    const dirs = [];
    const fileSpace = " ".repeat(6);
    const commonOptions = (0, _CommonWindowsInstallerConfiguration().getEffectiveOptions)(this.options, this.packager);
    const files = await _bluebirdLst().default.map((0, _fs().walk)(appOutDir), file => {
      const packagePath = file.substring(appOutDir.length + 1);
      const lastSlash = packagePath.lastIndexOf(path.sep);
      const fileName = lastSlash > 0 ? packagePath.substring(lastSlash + 1) : packagePath;
      let directoryId = null;
      let dirName = ""; // Wix Directory.FileSource doesn't work - https://stackoverflow.com/questions/21519388/wix-filesource-confusion

      if (lastSlash > 0) {
        // This Name attribute may also define multiple directories using the inline directory syntax.
        // For example, "ProgramFilesFolder:\My Company\My Product\bin" would create a reference to a Directory element with Id="ProgramFilesFolder" then create directories named "My Company" then "My Product" then "bin" nested beneath each other.
        // This syntax is a shortcut to defining each directory in an individual Directory element.
        dirName = packagePath.substring(0, lastSlash); // https://github.com/electron-userland/electron-builder/issues/3027

        directoryId = "d" + (0, _crypto().createHash)("md5").update(dirName).digest("base64").replace(/\//g, "_").replace(/\+/g, ".").replace(/=+$/, "");

        if (!dirNames.has(dirName)) {
          dirNames.add(dirName);
          dirs.push(`<Directory Id="${directoryId}" Name="${ROOT_DIR_ID}:\\${dirName.replace(/\//g, "\\")}\\"/>`);
        }
      } else if (!isRootDirAddedToRemoveTable) {
        isRootDirAddedToRemoveTable = true;
      } // since RegistryValue can be part of Component, *** *** *** *** *** *** *** *** *** wix cannot auto generate guid
      // https://stackoverflow.com/questions/1405100/change-my-component-guid-in-wix


      let result = `<Component${directoryId === null ? "" : ` Directory="${directoryId}"`}>`;
      result += `\n${fileSpace}  <File Name="${fileName}" Source="$(var.appDir)${path.sep}${packagePath}" ReadOnly="yes" KeyPath="yes"`;
      const isMainExecutable = packagePath === `${appInfo.productFilename}.exe`;

      if (isMainExecutable) {
        result += ' Id="mainExecutable"';
      } else if (directoryId === null) {
        result += ` Id="${path.basename(packagePath)}_f"`;
      }

      const isCreateDesktopShortcut = commonOptions.isCreateDesktopShortcut !== _CommonWindowsInstallerConfiguration().DesktopShortcutCreationPolicy.NEVER;

      if (isMainExecutable && (isCreateDesktopShortcut || commonOptions.isCreateStartMenuShortcut)) {
        result += `>\n`;
        const shortcutName = commonOptions.shortcutName;

        if (isCreateDesktopShortcut) {
          result += `${fileSpace}  <Shortcut Id="desktopShortcut" Directory="DesktopFolder" Name="${shortcutName}" WorkingDirectory="APPLICATIONFOLDER" Advertise="yes" Icon="icon.ico"/>\n`;
        }

        const hasMenuCategory = commonOptions.menuCategory != null;
        const startMenuShortcutDirectoryId = hasMenuCategory ? "AppProgramMenuDir" : "ProgramMenuFolder";

        if (commonOptions.isCreateStartMenuShortcut) {
          if (hasMenuCategory) {
            dirs.push(`<Directory Id="${startMenuShortcutDirectoryId}" Name="ProgramMenuFolder:\\${commonOptions.menuCategory}\\"/>`);
          }

          result += `${fileSpace}  <Shortcut Id="startMenuShortcut" Directory="${startMenuShortcutDirectoryId}" Name="${shortcutName}" WorkingDirectory="APPLICATIONFOLDER" Advertise="yes" Icon="icon.ico">\n`;
          result += `${fileSpace}    <ShortcutProperty Key="System.AppUserModel.ID" Value="${this.packager.appInfo.id}"/>\n`;
          result += `${fileSpace}  </Shortcut>\n`;
        }

        result += `${fileSpace}</File>`;

        if (hasMenuCategory) {
          result += `<RemoveFolder Id="${startMenuShortcutDirectoryId}" Directory="${startMenuShortcutDirectoryId}" On="uninstall"/>\n`;
        }
      } else {
        result += `/>`;
      }

      return `${result}\n${fileSpace}</Component>`;
    });
    return {
      dirs: listToString(dirs, 2),
      files: listToString(files, 3)
    };
  }

}

exports.default = MsiTarget;

function listToString(list, indentLevel) {
  const space = " ".repeat(indentLevel * 2);
  return list.join(`\n${space}`);
} 
// __ts-babel@6.0.4
//# sourceMappingURL=MsiTarget.js.map