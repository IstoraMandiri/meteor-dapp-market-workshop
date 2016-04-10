window.app = window.app || {}

import Web3 from 'web3'
window.web3 = new Web3()

import ipfs from 'ipfs-js'
window.ipfs = ipfs

// connect to ipfs (local ipfs daemon)
ipfs.setProvider()
// connect to web3 client (local geth node)
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))

Meteor.startup(function () {
  // tell market contract to use this instance of eth
  Market.eth = web3.eth
  // initialize eth accounts
  EthAccounts.init()
})
