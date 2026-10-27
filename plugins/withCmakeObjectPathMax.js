// Lets CMake hash long object-file paths in the app's native build so they stay under
// Windows' 260-character limit (codegen for react-native-gesture-handler exceeds it).
// The Android cross-compile platform defaults CMAKE_OBJECT_PATH_MAX to 1000, which disables that.
const { withAppBuildGradle } = require('expo/config-plugins');

const LINE = 'externalNativeBuild { cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=250" } }';

module.exports = function withCmakeObjectPathMax(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes('CMAKE_OBJECT_PATH_MAX')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /defaultConfig\s*\{/,
        (m) => `${m}\n        ${LINE}`,
      );
    }
    return cfg;
  });
};
