const fs = require('fs');
const path = require('path');
const { getExternalIP } = require('./ipUtils');
const { libp2pNode } = require('./main');


// Function to retrieve peer multiaddresses from the DHT table using peer IDs
async function getPeersFromDHT(peerIds) {
  const node = libp2pNode();
  if (!node) {
    console.error('Libp2p node is not available.');
    return [];
  }

  const peers = [];
  for (const peerId of peerIds) {
    try {
      const peerInfo = await node.peerRouting.findPeer(peerId);
      peers.push(peerInfo.multiaddrs);
    } catch (err) {
      console.error('Error finding peer:', err.message);
    }
  }
  return peers;
}

async function savePeersToJSON(peers) {
  const filePath = path.join(__dirname, 'peers.json');
  const data = JSON.stringify(peers, null, 2);
  fs.writeFileSync(filePath, data);
}

(async () => {
  // Replace this array with actual peer IDs from your NFTs
  const peerIds = [
    'QmPeerId1',
    'QmPeerId2',
  ];

  const peers = await getPeersFromDHT(peerIds);
  savePeersToJSON(peers);

  const externalIP = await getExternalIP();
  console.log('Your external IP:', externalIP);
})();
