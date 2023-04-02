const { exec } = require('child_process');
const sudoPrompt = require('sudo-prompt');
const path = require('path');

async function startWireGuardVPN(configPath) {
    return new Promise(async (resolve, reject) => {
      const isWin = process.platform === 'win32';
      const options = {
        name: 'WireGuard'
      };
  
      if (isWin) {
        
        const command = `start "" "C:\\Program Files\\WireGuard\\wireguard.exe" /installtunnelservice "${configPath}"`;
        console.log(command);
        sudoPrompt.exec(command, options, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else {
        // For macOS and Linux
        const command = `wg-quick up ${configPath}`;
  
        sudoPrompt.exec(command, options, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }
    });
  }

  async function stopWireGuardVPN(configPath) {
    return new Promise(async (resolve, reject) => {
      const isWin = process.platform === 'win32';
      const options = {
        name: 'WireGuard'
      };
  
      if (isWin) {
        const configFilename = path.basename(configPath, '.conf');
        const command = `"C:\\Program Files\\WireGuard\\wireguard.exe" /uninstalltunnelservice "${configFilename}"`;
  
        sudoPrompt.exec(command, options, (error) => {
          if (error) {
            if (error.message.includes('not found')) {
              console.warn('WireGuard process not found, assuming it is not running.');
              resolve();
            } else {
              reject(error);
            }
          } else {
            resolve();
          }
        });
      } else {
        // For macOS and Linux
        const command = `wg-quick down ${configPath}`;
  
        sudoPrompt.exec(command, options, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }
    });
  }
  
module.exports = {
  startWireGuardVPN,
  stopWireGuardVPN,
};
