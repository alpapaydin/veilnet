const Libp2p = require('libp2p');
const Websockets = require('libp2p-websockets');
const Bootstrap = require('libp2p-bootstrap');
const TCP = require('libp2p-tcp');
const { NOISE } = require('libp2p-noise');
const MPLEX = require('libp2p-mplex');
const DHT = require('libp2p-kad-dht');
const { exec } = require('child_process');
const Gossipsub = require('libp2p-gossipsub');
const CUSTOM_DISCOVERY_TOPIC = 'vpn-nft-discovery';
const Circuit = require('libp2p-circuit');
const PeerId = require('peer-id');
const { startWireGuardVPN, stopWireGuardVPN } = require('./wireguard/wireguard');

const bootstrapList = [
  '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
  '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
];

const AUTH_TOKEN = "adana31";


async function createLibp2pNode() {
  const peerId = await PeerId.create({ bits: 1024, keyType: 'RSA' });

  const node = await Libp2p.create({
    peerId,
    addresses: {
      listen: [
        '/ip4/0.0.0.0/tcp/0',
        '/ip6/::/tcp/0',
        '/ip4/0.0.0.0/tcp/0/ws', // Add this line
        '/ip6/::/tcp/0/ws', // Add this line
      ],
    },
    modules: {
      transport: [Websockets, TCP],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
      peerDiscovery: [Bootstrap],
      dht: DHT,
      relay: Circuit,
      pubsub: Gossipsub,
    },
    config: {
      peerDiscovery: {
        bootstrap: {
          enabled: true,
          list: bootstrapList,
        },
      },
      },
      dht: {
        enabled: true,
        randomWalk: {
          enabled: true
        }
      },
      relay: {
        enabled: true,
        hop: {
          enabled: true,
          active: false,
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
      authToken: data.authToken,
      nftPublicKey: data.nftPublicKey,
      endpoint: data.endpoint,
      allowedIPs: data.allowedIPs,
    };
  
    // Check if the authToken matches the pre-shared token.
    if (peerInfo.id && peerInfo.authToken === AUTH_TOKEN) {
      onPeerDiscovered(peerInfo);
    } else {
      console.log("Unauthorized peer connection attempt:", peerInfo.id);
    }
  });
  

  await node.pubsub.subscribe(CUSTOM_DISCOVERY_TOPIC);
}

async function announcePeer(node, nftPublicKey, endpoint, allowedIPs) {
  const data = {
    authToken: AUTH_TOKEN,
    nftPublicKey,
    endpoint,
    allowedIPs,
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
    start: () => startWireGuardVPN(configPath),
    stop: () => stopWireGuardVPN(configPath),
  };
}

async function addWireGuardPeer(configPath, publicKey, endpoint, allowedIPs) {
  publicKey = publicKey.replace(/['"]+/g, ''); // Remove double quotes from the public key string
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
  getConnectedPeers,
  CUSTOM_DISCOVERY_TOPIC
};
