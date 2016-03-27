Meteor.startup(function () {
  // connect to provider and set default account
  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))
  web3.eth.defaultAccount = web3.eth.coinbase
})
