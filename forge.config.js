const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Dear Bones',
    executableName: 'dear-bones',
    icon: './assets/icon', // You can add an icon file later
    platform: 'darwin',
    arch: 'arm64',
    osxUniversal: {
      // Optional: create universal binary for both Intel and Apple Silicon
      // Remove this if you only need arm64
    },
    extendInfo: {
      LSMinimumSystemVersion: '11.0', // macOS Big Sur 11.0 minimum
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    generateAssets: async () => {
      // Build the React app before packaging
      const { execSync } = require('child_process');
      execSync('npm run build', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    },
  },
};
