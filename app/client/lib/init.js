// create global `app` namespace
window.app = window.app || {}
// es6 import - notice the capitalized Web3
import Web3 from 'web3'
// initialize web3
window.web3 = new Web3()
// set the provider to our local dev node
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))