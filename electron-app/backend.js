const Libp2p = require('libp2p');
const TCP = require('libp2p-tcp');
const { NOISE } = require('libp2p-noise');
const MPLEX = require('libp2p-mplex');
const DHT = require('libp2p-kad-dht');
const { exec } = require('child_process');
const Gossipsub = require('libp2p-gossipsub');
const CUSTOM_DISCOVERY_TOPIC = 'vpn-nft-discovery';

async function createLibp2pNode() {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    modules: {
      transport: [TCP],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
      dht: DHT,
      pubsub: Gossipsub,
    },
    config: {
      dht: {
        enabled: true,
        randomWalk: {
          enabled: true
        }
      },
      pubsub: {
        enabled: true,
        emitSelf: true
      }
    }
  });

  return node;
}

// Add necessary functions for WireGuard VPN configuration and management here

async function storeNFTInfo(node, nftPublicKey, multiaddr) {
  const nftKey = `nft:${nftPublicKey}`;
  await node.contentRouting.put(nftKey, multiaddr);
}

async function findPeerByNFTPublicKey(node, nftPublicKey) {
  const nftKey = `nft:${nftPublicKey}`;
  const multiaddr = await node.contentRouting.get(nftKey);
  return multiaddr;
}


async function handlePeerDiscovery(node, onPeerDiscovered) {
  node.connectionManager.on('peer:connect', (connection) => {
    if (connection.remotePeer) {
      console.log('Connected to peer:', connection.remotePeer.toB58String());
    }
  });

  node.pubsub.on(CUSTOM_DISCOVERY_TOPIC, (msg) => {
    const data = JSON.parse(msg.data.toString());
    const peerInfo = {
      id: msg.from,
      nftPublicKey: data.nftPublicKey,
      endpoint: data.endpoint,
      allowedIPs: data.allowedIPs
    };

    if (peerInfo.id) {
      onPeerDiscovered(peerInfo);
    }
  });

  await node.pubsub.subscribe(CUSTOM_DISCOVERY_TOPIC);
}

async function announcePeer(node, nftPublicKey, endpoint, allowedIPs) {
  const data = {
    nftPublicKey,
    endpoint,
    allowedIPs
  };

  await node.pubsub.publish(CUSTOM_DISCOVERY_TOPIC, Buffer.from(JSON.stringify(data)));
}

function getConnectedPeers(node) {
  if (!node) return [];
  const peers = node.connectionManager.connections.keys();
  return Array.from(peers);
}

async function createWireGuardVPN(configPath) {
  return {
    configPath,
    async start() {
      return new Promise((resolve, reject) => {
        exec(`wg-quick up ${configPath}`, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    },
    async stop() {
      return new Promise((resolve, reject) => {
        exec(`wg-quick down ${configPath}`, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  };
}

async function addWireGuardPeer(configPath, publicKey, endpoint, allowedIPs) {
  return new Promise((resolve, reject) => {
    exec(`wg setconf ${configPath} peer ${publicKey} endpoint ${endpoint} allowed-ips ${allowedIPs}`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  createLibp2pNode,
  createWireGuardVPN,
  addWireGuardPeer,
  handlePeerDiscovery,
  announcePeer,
  storeNFTInfo,
  findPeerByNFTPublicKey,
  getConnectedPeers
};
