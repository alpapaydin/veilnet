const { ipcRenderer } = require('electron');
let toggling = false;

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

const vpnToggle = document.getElementById('toggleVPN');
vpnToggle.addEventListener('change', async (event) => {
  if (toggling) {
    event.preventDefault();
    return;
  }

  toggling = true;
  vpnToggle.disabled = true;
  const enabled = vpnToggle.checked;
  await ipcRenderer.invoke('toggleVPN', enabled);
  
  setTimeout(() => {
    toggling = false;
    vpnToggle.disabled = false;
  }, 2000);
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
