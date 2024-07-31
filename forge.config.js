const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

const generateLatestYml = require("./scripts/generate-latest-yml");

module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  hooks: {
    postMake: async (forgeConfig, makeResults) => {
      const latestYmlPath = generateLatestYml();
      if (latestYmlPath) {
        makeResults.forEach((result) => {
          if (result.platform === "win32" && result.arch === "x64") {
            result.artifacts.push(latestYmlPath);
          }
        });
      }
      return makeResults;
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "electron-update-test",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-s3",
      config: {
        bucket: "shuleizhao-electron-update-test",
        region: "us-east-2",
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/index.html",
              js: "./src/renderer.ts",
              name: "main_window",
              preload: {
                js: "./src/preload.ts",
              },
            },
          ],
        },
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
    }),
  ],
};
