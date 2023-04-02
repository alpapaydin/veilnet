const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ensureWireGuardInstallation } = require('./wireguard/installWireguard');
const { generateWireGuardKeys, updateWireGuardConfig } = require('./wireguard/configUpdater');
const {
  createLibp2pNode,
  createWireGuardVPN,
  connectToPeer,
  handlePeerDiscovery,
  setupVPNPeers,
  getConnectedPeers,
  addWireGuardPeer,
  announcePeer,
  CUSTOM_DISCOVERY_TOPIC
} = require('./backend');

let mainWindow = null;
let libp2pNode = null;
let wireGuardVPN = null;
let updatePeerListTimeoutId;
let lastToggleTime = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function getAllowedIPs(peerId) {
  const peersData = JSON.parse(fs.readFileSync('peers.json', 'utf8'));
  return peersData[peerId]?.allowedIPs;
}

function updatePeerList(window, node) {
  if (!node) {
    window.webContents.send('updatePeerList', []);
    return;
  }

  const connectedPeers = getConnectedPeers(node);
  const filteredPeers = connectedPeers.filter((peer) => peer !== undefined);

  // Include the local node's peer ID in the list
  const localPeerId = node.peerId.toB58String();
  const peerList = [localPeerId, ...filteredPeers];

  window.webContents.send('updatePeerList', peerList);

  updatePeerListTimeoutId = setTimeout(() => {
    updatePeerList(window, node);
  }, 5000); // Update the peer list every 5 seconds
}


app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

async function getPublicIp() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error getting public IP:', error);
    return null;
  }
}

ipcMain.handle('toggleVPN', async (event, enabled) => {
  const currentTime = Date.now();
  const debounceDelay = 2000; // 2 seconds
  if (currentTime - lastToggleTime < debounceDelay) {
    console.log('Toggle action ignored due to debounce delay');
    return;
  }

  lastToggleTime = currentTime;
  
  if (enabled) {
    await ensureWireGuardInstallation();
    const wireGuardPath = `${__dirname}/wireguard`;
    const configPath = path.resolve(wireGuardPath, 'config.conf');

    // Update the WireGuard config with the private and public keys
    const keyPair = await generateWireGuardKeys();
    await updateWireGuardConfig(configPath, keyPair);

    libp2pNode = await createLibp2pNode();
    wireGuardVPN = await createWireGuardVPN(configPath);
    await libp2pNode.start();

    // Subscribe to the pubsub topic
    libp2pNode.pubsub.subscribe(CUSTOM_DISCOVERY_TOPIC, (message) => {
      console.log('Received message:', message);
    });

    handlePeerDiscovery(libp2pNode, async (peerInfo) => {
      // Use custom logic to determine if the discovered peer should be added to the VPN
      // Example: Fetch the NFT ownership of the discovered peer and compare it to your requirements
    
      const publicKey = peerInfo.publicKey; // Replace with the actual public key of the WireGuard peer
      const endpoint = peerInfo.endpoint; // Replace with the actual endpoint of the WireGuard peer (ip:port)
      const allowedIPs = peerInfo.allowedIPs; // Replace with the actual allowed IPs for the WireGuard peer (e.g., '10.0.0.2/32')
    
      await addWireGuardPeer(wireGuardVPN.configPath, publicKey, endpoint, allowedIPs);
    });

    // Announce the peer with its NFT public key, WireGuard endpoint, and allowed IPs
    const nftPublicKey = 'your-nft-public-key'; // Get this value from the authentication module
    const ip = await getPublicIp();
    const endpoint = `${ip}:31820`; // Get your external IP and use your desired WireGuard port
    const allowedIPs = getAllowedIPs(libp2pNode.peerId.toB58String());
    announcePeer(libp2pNode, nftPublicKey, endpoint, allowedIPs);

    await wireGuardVPN.start();
    updatePeerList(mainWindow, libp2pNode);
  } else {
    await libp2pNode.pubsub.unsubscribe(CUSTOM_DISCOVERY_TOPIC);
    await libp2pNode.stop();
    await wireGuardVPN.stop();

    clearTimeout(updatePeerListTimeoutId);

    libp2pNode = null;
    wireGuardVPN = null;

    updatePeerList(mainWindow, null);
  }
});

ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});


module.exports.libp2pNode = () => libp2pNode;