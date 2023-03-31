const { ipcRenderer } = require('electron');

function authenticate() {
  // TODO: Call the necessary NFT authentication functions
  console.log('Authenticate with Metamask button clicked');

  // Hide the "Authenticate with Metamask" button
  document.getElementById('authenticate').style.display = 'none';

  // Display the "Toggle VPN" switch
  const vpnSwitch = document.getElementById('vpnSwitch');
  vpnSwitch.style.display = 'inline-block';
  console.log('Toggle VPN switch displayed');
}

document.getElementById('authenticate').addEventListener('click', authenticate);

document.getElementById('toggleVPN').addEventListener('change', (event) => {
  ipcRenderer.invoke('toggleVPN', event.target.checked);
});

const peerListElement = document.getElementById('peer-list');

ipcRenderer.on('updatePeerList', (event, connectedPeers) => {
  peerListElement.innerHTML = '';

  for (const peer of connectedPeers) {
    const listItem = document.createElement('li');
    listItem.textContent = peer;
    peerListElement.appendChild(listItem);
  }
});
