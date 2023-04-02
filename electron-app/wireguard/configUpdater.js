const fs = require('fs');
const ini = require('ini');
const { exec } = require('child_process');

async function generateWireGuardKeys() {
  return new Promise((resolve, reject) => {
    exec('wg genkey', (err, privateKey) => {
      if (err) {
        reject(err);
      } else {
        privateKey = privateKey.trim();
        exec(`echo ${privateKey} | wg pubkey`, (err, publicKey) => {
          if (err) {
            reject(err);
          } else {
            publicKey = publicKey.trim();
            resolve({ privateKey, publicKey });
          }
        });
      }
    });
  });
}



async function updateWireGuardConfig(configPath, keyPair) {
  const privateKey = keyPair.privateKey.trim();
  const publicKey = keyPair.publicKey.trim();

  const configFile = fs.readFileSync(configPath, 'utf-8');
  const configLines = configFile.split('\n');

  const newConfigLines = configLines.map(line => {
    if (line.startsWith('PrivateKey')) {
      return `PrivateKey = ${privateKey}`;
    } else if (line.startsWith('PublicKey')) {
      return `PublicKey = ${publicKey}`;
    } else {
      return line;
    }
  });

  const updatedConfigFile = newConfigLines.join('\n');
  fs.writeFileSync(configPath, updatedConfigFile);

  console.log('WireGuard config file updated');
}




module.exports = {
  generateWireGuardKeys,
  updateWireGuardConfig,
};
