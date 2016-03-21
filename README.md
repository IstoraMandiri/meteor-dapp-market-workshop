# Dapp Workshop

## Planning Phase

### Demo Overview

The Dapp we build will be a simple decentralised marketplace. This gives anyone the ability to create a marketplace registry (a list of items) and list any item for sale, which can then be purchased by anyone and is facilitated using an [escrow contrtact](https://github.com/frozeman/example-escrow-dapp). It's also censorship-resistent meaning there are no single points of centralisation as everything is managed by decentralised networks (ethereum + IPFS).

There are 3 main routes in the app:

* Registry list (select market)
  * View Market
  * Create new market
* Registry view (items list)
  * View Item
  * Create new Item
* Escrow contract view (item details)
  * Purchase / Refund / etc.

### Prerequisites

* [Geth](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum)
* [Node `0.10.x`](https://github.com/creationix/nvm) `nvm install 0.10; nvm use 0.10`
* [Meteor](http://meteor.com)
* [Meteor-build-client](https://github.com/frozeman/meteor-build-client)
* [IPFS](https://ipfs.io/docs/install/)

### Program Overview (WIP)

```
Explanation & Demos (slideshow pres)
  - Blockchain
  - Ethereum
  - EVM
  - Dapps
    - Example Dapps
      - State of the dapps
    - Technical
      - Solidity
      - (Test) Networks
      - UI
        - HTML5 / iOS / VR
  - Meteor
    - Official Ethereum Packages
  - Mist
  - IPFS
  - Decentralised Market
    - Escrow Contract https://github.com/frozeman/example-escrow-dapp
    - Regsitry Contract
    - Demo app

Walkthrough Build
  - Writing the contracts
  - Building the UI
  - Deployment
    - Locally testing with testnet
    - Different deploy environments

Going Beyond
  - Improving the Demo
  - Dapple
```

## TODOs

```
- Build the demo
- Write tutorial
```