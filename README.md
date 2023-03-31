Veilnet Manifesto

We believe in the power of decentralized networks to enable individuals to connect and interact with each other in new and innovative ways. As we navigate an increasingly digital world, we recognize the need for tools and technologies that enable us to protect our privacy and maintain our autonomy.

We propose a new model for anonymity on the blockchain - a network of 1000 independent NFT proxies that can connect to each other and mutually provide anonymity to their owners. By sharing ownership of these proxies, we can create a decentralized network that provides robust privacy protections and resists centralized control.

Each NFT will represent an independent proxy on the network, and will be owned jointly by a group of individuals who share a commitment to protecting their privacy. By owning a proxy, each individual can interact with the network without revealing their true identity. Each proxy will be measured based on uptime and bandwidth, and owners will only benefit from other proxies' efficiency to the extent that they provide uptime and bandwidth to the network.

We believe that this model of shared ownership and mutual benefit can help to create a more private, secure, and decentralized internet. By working together, we can build a network that is resilient to censorship, surveillance, and control. We invite others to join us in this endeavor, and to explore new models of anonymity, privacy, and autonomy on the blockchain.


-Veilnet-
A peer to peer VPN network program for cross-platform. In which users are acting as both vpn server and client when they activate it and form a vpn network in internet in all network traffic. It will also have metamask nft authentication so that only specific nft holders will be able to join the network. Also it will integrate resource monitoring and allocation rules between peers based on their network contribution. With a simple user-friendly gui to authenticate, join the network and see other peers and contribution.

Technology Stack considered is

    Networking: libp2p
    VPN: WireGuard
    Cross-platform development: Electron (for desktop) and React Native (for mobile)
    NFT Authentication: Ethereum Web3.js library and Metamask API
    Resource Monitoring: Custom scripts using system libraries (e.g., psutil for Python)
    User Interface: React for Electron and React Native for mobile

Project Structure in general

    Networking Module
        Establish P2P connections using libp2p
        Implement a DHT for peer discovery and network routing

    VPN Module
        Implement the VPN functionality using WireGuard
        Automatically configure the VPN connection for peers in the network

    NFT Authentication Module
        Implement Metamask integration with the Web3.js library
        Verify NFT ownership on the Ethereum blockchain
        Add authentication middleware to restrict access to the P2P network

    Resource Monitoring and Allocation Module
        Monitor and record each peer's system resources (CPU, RAM, network bandwidth)
        Implement an algorithm to allocate resources based on a peer's contribution
        Dynamically adjust the P2P network based on resource allocation rules

    User Interface
        Implement a cross-platform UI using Electron for desktop and React Native for mobile
        Create a simple and user-friendly interface for authentication and joining the network
        Display peer and resource contribution information within the interface

    Integration and Testing
        Integrate all modules and ensure proper functioning
        Perform thorough testing of the application on different platforms and devices
        Optimize the application for performance, security, and scalability