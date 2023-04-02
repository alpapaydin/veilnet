const { exec } = require('child_process');
const os = require('os');
const sudo = require('sudo-prompt');
const request = require('request');
const fs = require('fs');

async function checkWireGuardInstallation() {
  return new Promise((resolve, reject) => {
    exec('wg', (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function installWireGuard() {
    const platform = os.platform();
  
    switch (platform) {
      case 'win32':
        // Windows installation
        return new Promise((resolve, reject) => {
          console.log('Installing WireGuard on Windows...');
          const installerUrl = 'https://download.wireguard.com/windows-client/wireguard-installer.exe';
          const installerPath = 'wireguard-installer.exe';
  
          // Download the installer
          request(installerUrl)
            .pipe(fs.createWriteStream(installerPath))
            .on('close', () => {
              // Run the installer with administrator privileges
              sudo.exec(`"${installerPath}"`, { name: 'WireGuard Installer' }, (error, stdout, stderr) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(true);
                }
              });
            });
        });

    case 'darwin':
      // macOS installation
      return new Promise((resolve, reject) => {
        console.log('Installing WireGuard on macOS...');
        exec('brew install wireguard-tools', (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        });
      });

    case 'linux':
      // Linux installation (assuming Ubuntu)
      return new Promise((resolve, reject) => {
        console.log('Installing WireGuard on Linux...');
        exec('sudo apt-get update && sudo apt-get install wireguard', (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        });
      });

    default:
      console.log('Unsupported platform');
      return false;
  }
}

async function ensureWireGuardInstallation() {
  const isInstalled = await checkWireGuardInstallation();

  if (!isInstalled) {
    console.log('WireGuard is not installed. Installing now...');
    await installWireGuard();
  } else {
    console.log('WireGuard is already installed.');
  }
}

module.exports = {
  ensureWireGuardInstallation
};
