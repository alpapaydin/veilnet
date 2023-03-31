const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const { getExternalIP } = require('./ipUtils');
const {
  createLibp2pNode,
  createWireGuardVPN,
  connectToPeer,
  handlePeerDiscovery,
  setupVPNPeers,
  getConnectedPeers,
  addWireGuardPeer,
  announcePeer
} = require('./backend');

let mainWindow = null;
let libp2pNode = null;
let wireGuardVPN = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
  if (!node) return;

  const connectedPeers = getConnectedPeers(node);
  const filteredPeers = connectedPeers.filter((peer) => peer !== undefined);

  // Include the local node's peer ID in the list
  const localPeerId = node.peerId.toB58String();
  const peerList = [localPeerId, ...filteredPeers];

  window.webContents.send('updatePeerList', peerList);

  setTimeout(() => {
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

ipcMain.handle('toggleVPN', async (event, enabled) => {
  if (enabled) {
    libp2pNode = await createLibp2pNode();
    wireGuardVPN = await createWireGuardVPN('wireguard/config.conf');

    await libp2pNode.start();

    // Subscribe to the pubsub topic
    libp2pNode.pubsub.subscribe('your-topic', (message) => {
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
    const endpoint = `${await publicIp.v4()}:31820`; // Get your external IP and use your desired WireGuard port
    const allowedIPs = getAllowedIPs(libp2pNode.peerId.toB58String());
    announcePeer(libp2pNode, nftPublicKey, endpoint, allowedIPs);

    await wireGuardVPN.start();
    updatePeerList(mainWindow, libp2pNode);
  } else {
    libp2pNode.pubsub.unsubscribe('your-topic');
    await libp2pNode.stop();
    await wireGuardVPN.stop();

    libp2pNode = null;
    wireGuardVPN = null;
  }
});

module.exports.libp2pNode = () => libp2pNode;