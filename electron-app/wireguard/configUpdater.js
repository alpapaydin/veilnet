const fs = require('fs');
const ini = require('ini');
const path = require('path');
const { exec } = require('child_process');

async function generateWireGuardKeyPair() {
  return new Promise((resolve, reject) => {
    exec('wg genkey', (err, privateKey) => {
      if (err) {
        reject(err);
      } else {
        const privateKeyPath = path.join(__dirname, 'privatekey');
        fs.writeFileSync(privateKeyPath, privateKey.trim());

        exec(`echo "${privateKey.trim()}" | wg pubkey`, (err, publicKey) => {
          if (err) {
            reject(err);
          } else {
            const publicKeyPath = path.join(__dirname, 'publickey');
            fs.writeFileSync(publicKeyPath, publicKey.trim());
            resolve();
          }
        });
      }
    });
  });
}

async function updateWireGuardConfig(configPath) {
  const privateKeyPath = path.join(__dirname, 'privatekey');
  const publicKeyPath = path.join(__dirname, 'publickey');

  const privateKey = fs.readFileSync(privateKeyPath, 'utf-8').trim();
  const publicKey = fs.readFileSync(publicKeyPath, 'utf-8').trim();

  const configFile = fs.readFileSync(configPath, 'utf-8');
  const config = ini.parse(configFile);

  config.Interface.PrivateKey = privateKey;

  if (config['Peer']) {
    config['Peer'].PublicKey = publicKey;
  }

  const updatedConfigFile = ini.stringify(config);
  fs.writeFileSync(configPath, updatedConfigFile);

  console.log('WireGuard config file updated');
}

module.exports = {
  generateWireGuardKeyPair,
  updateWireGuardConfig,
};
