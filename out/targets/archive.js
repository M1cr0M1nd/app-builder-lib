"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tar = tar;
exports.compute7zCompressArgs = compute7zCompressArgs;
exports.archive = archive;

function _zipBin() {
  const data = require("7zip-bin");

  _zipBin = function () {
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

var path = _interopRequireWildcard(require("path"));

function _tools() {
  const data = require("./tools");

  _tools = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/** @internal */
async function tar(compression, format, outFile, dirToArchive, isMacApp, tempDirManager) {
  const tarFile = await tempDirManager.getTempFile({
    suffix: ".tar"
  });
  const tarArgs = debug7zArgs("a");
  tarArgs.push(tarFile);
  tarArgs.push(path.basename(dirToArchive));
  await Promise.all([(0, _builderUtil().exec)(_zipBin().path7za, tarArgs, {
    cwd: path.dirname(dirToArchive)
  }), // remove file before - 7z doesn't overwrite file, but update
  (0, _fs().unlinkIfExists)(outFile)]);

  if (!isMacApp) {
    await (0, _builderUtil().exec)(_zipBin().path7za, ["rn", tarFile, path.basename(dirToArchive), path.basename(outFile, `.${format}`)]);
  }

  if (format === "tar.lz") {
    // noinspection SpellCheckingInspection
    let lzipPath = "lzip";

    if (process.platform === "darwin") {
      lzipPath = path.join((await (0, _tools().getLinuxToolsPath)()), "bin", lzipPath);
    }

    await (0, _builderUtil().exec)(lzipPath, [compression === "store" ? "-1" : "-9", "--keep"
    /* keep (don't delete) input files */
    , tarFile]); // bloody lzip creates file in the same dir where input file with postfix `.lz`, option --output doesn't work

    await (0, _fsExtra().move)(`${tarFile}.lz`, outFile);
    return;
  }

  const args = compute7zCompressArgs(format === "tar.xz" ? "xz" : format === "tar.bz2" ? "bzip2" : "gzip", {
    isRegularFile: true,
    method: "DEFAULT",
    compression
  });
  args.push(outFile, tarFile);
  await (0, _builderUtil().exec)(_zipBin().path7za, args, {
    cwd: path.dirname(dirToArchive)
  }, _builderUtil().debug7z.enabled);
}

function compute7zCompressArgs(format, options = {}) {
  let storeOnly = options.compression === "store";
  const args = debug7zArgs("a");
  let isLevelSet = false;

  if (process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL != null) {
    storeOnly = false;
    args.push(`-mx=${process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL}`);
    isLevelSet = true;
  }

  const isZip = format === "zip";

  if (!storeOnly) {
    if (isZip && options.compression === "maximum") {
      // http://superuser.com/a/742034
      args.push("-mfb=258", "-mpass=15");
    }

    if (!isLevelSet) {
      // https://github.com/electron-userland/electron-builder/pull/3032
      args.push("-mx=" + (!isZip || options.compression === "maximum" ? "9" : "7"));
    }
  }

  if (options.dictSize != null) {
    args.push(`-md=${options.dictSize}m`);
  } // https://sevenzip.osdn.jp/chm/cmdline/switches/method.htm#7Z
  // https://stackoverflow.com/questions/27136783/7zip-produces-different-output-from-identical-input
  // tc and ta are off by default, but to be sure, we explicitly set it to off
  // disable "Stores NTFS timestamps for files: Modification time, Creation time, Last access time." to produce the same archive for the same data


  if (!options.isRegularFile) {
    args.push("-mtc=off");
  }

  if (format === "7z" || format.endsWith(".7z")) {
    if (options.solid === false) {
      args.push("-ms=off");
    }

    if (options.isArchiveHeaderCompressed === false) {
      args.push("-mhc=off");
    } // args valid only for 7z
    // -mtm=off disable "Stores last Modified timestamps for files."


    args.push("-mtm=off", "-mta=off");
  }

  if (options.method != null) {
    if (options.method !== "DEFAULT") {
      args.push(`-mm=${options.method}`);
    }
  } else if (isZip || storeOnly) {
    args.push(`-mm=${storeOnly ? "Copy" : "Deflate"}`);
  }

  if (isZip) {
    // -mcu switch:  7-Zip uses UTF-8, if there are non-ASCII symbols.
    // because default mode: 7-Zip uses UTF-8, if the local code page doesn't contain required symbols.
    // but archive should be the same regardless where produced
    args.push("-mcu");
  }

  return args;
} // 7z is very fast, so, use ultra compression

/** @internal */


async function archive(format, outFile, dirToArchive, options = {}) {
  const args = compute7zCompressArgs(format, options); // remove file before - 7z doesn't overwrite file, but update

  await (0, _fs().unlinkIfExists)(outFile);
  args.push(outFile, options.withoutDir ? "." : path.basename(dirToArchive));

  if (options.excluded != null) {
    for (const mask of options.excluded) {
      args.push(`-xr!${mask}`);
    }
  }

  try {
    await (0, _builderUtil().exec)(_zipBin().path7za, args, {
      cwd: options.withoutDir ? dirToArchive : path.dirname(dirToArchive)
    }, _builderUtil().debug7z.enabled);
  } catch (e) {
    if (e.code === "ENOENT" && !(await (0, _fs().exists)(dirToArchive))) {
      throw new Error(`Cannot create archive: "${dirToArchive}" doesn't exist`);
    } else {
      throw e;
    }
  }

  return outFile;
}

function debug7zArgs(command) {
  const args = [command, "-bd"];

  if (_builderUtil().debug7z.enabled) {
    args.push("-bb");
  }

  return args;
} 
// __ts-babel@6.0.4
//# sourceMappingURL=archive.js.map