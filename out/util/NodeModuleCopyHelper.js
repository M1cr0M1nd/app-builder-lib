"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NodeModuleCopyHelper = void 0;

function _bluebirdLst() {
  const data = _interopRequireDefault(require("bluebird-lst"));

  _bluebirdLst = function () {
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

function _fileMatcher() {
  const data = require("../fileMatcher");

  _fileMatcher = function () {
    return data;
  };

  return data;
}

function _platformPackager() {
  const data = require("../platformPackager");

  _platformPackager = function () {
    return data;
  };

  return data;
}

function _AppFileWalker() {
  const data = require("./AppFileWalker");

  _AppFileWalker = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const excludedFiles = new Set([".DS_Store", "node_modules"
/* already in the queue */
, "CHANGELOG.md", "ChangeLog", "changelog.md", "binding.gyp", ".npmignore"].concat(_fileMatcher().excludedNames.split(",")));
const topLevelExcludedFiles = new Set(["test.js", "karma.conf.js", ".coveralls.yml", "README.md", "readme.markdown", "README", "readme.md", "readme", "test", "__tests__", "tests", "powered-test", "example", "examples", ".bin"]);
/** @internal */

class NodeModuleCopyHelper extends _AppFileWalker().FileCopyHelper {
  constructor(matcher, packager) {
    super(matcher, matcher.isEmpty() ? null : matcher.createFilter(), packager);
  }

  async collectNodeModules(baseDir, moduleNames, nodeModuleExcludedExts) {
    const filter = this.filter;
    const metadata = this.metadata;
    const onNodeModuleFile = (0, _platformPackager().resolveFunction)(this.packager.config.onNodeModuleFile, "onNodeModuleFile");
    const result = [];
    const queue = [];

    for (const moduleName of moduleNames) {
      const tmpPath = baseDir + path.sep + moduleName;
      queue.length = 1; // The path should be corrected in Windows that when the moduleName is Scoped packages named.

      const depPath = path.normalize(tmpPath);
      queue[0] = depPath;

      while (queue.length > 0) {
        const dirPath = queue.pop();
        const childNames = await (0, _fsExtra().readdir)(dirPath);
        childNames.sort();
        const isTopLevel = dirPath === depPath;
        const dirs = []; // our handler is async, but we should add sorted files, so, we add file to result not in the mapper, but after map

        const sortedFilePaths = await _bluebirdLst().default.map(childNames, name => {
          if (onNodeModuleFile != null) {
            onNodeModuleFile(dirPath + path.sep + name);
          }

          if (excludedFiles.has(name) || name.startsWith("._")) {
            return null;
          }

          for (const ext of nodeModuleExcludedExts) {
            if (name.endsWith(ext)) {
              return null;
            }
          } // noinspection SpellCheckingInspection


          if (isTopLevel && (topLevelExcludedFiles.has(name) || moduleName === "libui-node" && (name === "build" || name === "docs" || name === "src"))) {
            return null;
          }

          if (dirPath.endsWith("build")) {
            if (name === "gyp-mac-tool" || name === "Makefile" || name.endsWith(".mk") || name.endsWith(".gypi") || name.endsWith(".Makefile")) {
              return null;
            }
          } else if (dirPath.endsWith("Release") && (name === ".deps" || name === "obj.target")) {
            return null;
          } else if (name === "src" && (dirPath.endsWith("keytar") || dirPath.endsWith("keytar-prebuild"))) {
            return null;
          } else if (dirPath.endsWith("lzma-native") && (name === "build" || name === "deps")) {
            return null;
          }

          const filePath = dirPath + path.sep + name;
          return (0, _fsExtra().lstat)(filePath).then(stat => {
            if (filter != null && !filter(filePath, stat)) {
              return null;
            }

            if (!stat.isDirectory()) {
              metadata.set(filePath, stat);
            }

            const consumerResult = this.handleFile(filePath, dirPath, stat);

            if (consumerResult == null) {
              if (stat.isDirectory()) {
                dirs.push(name);
                return null;
              } else {
                return filePath;
              }
            } else {
              return consumerResult.then(it => {
                // asarUtil can return modified stat (symlink handling)
                if ((it == null ? stat : it).isDirectory()) {
                  dirs.push(name);
                  return null;
                } else {
                  return filePath;
                }
              });
            }
          });
        }, _fs().CONCURRENCY);

        for (const child of sortedFilePaths) {
          if (child != null) {
            result.push(child);
          }
        }

        dirs.sort();

        for (const child of dirs) {
          queue.push(dirPath + path.sep + child);
        }
      }
    }

    return result;
  }

} exports.NodeModuleCopyHelper = NodeModuleCopyHelper;
// __ts-babel@6.0.4
//# sourceMappingURL=NodeModuleCopyHelper.js.map