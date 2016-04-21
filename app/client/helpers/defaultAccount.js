app.setDefaultAccount = function (address) {
  // ensure it exists
  if (EthAccounts.findOne({address: address})) {
    // check if the current default exists and unset it
    const thisDefault = EthAccounts.findOne({default: true})
    if (thisDefault) {
      EthAccounts.update(thisDefault._id, {$unset: {default: true}})
    }
    // update the given address
    EthAccounts.update({address}, {$set: {default: true}})
    // set web3 defualt adddres
    web3.eth.defaultAccount = address
  }
}

app.getDefaultAccount = function () {
  return EthAccounts.findOne({default: true})
}

app.getDefaultAddress = function () {
  const account = app.getDefaultAccount()
  if (account) {
    return account.address
  }
}

UI.registerHelper('defaultAddress', app.getDefaultAddress)

// set the default account to coinbase if it's not set
Meteor.startup(function () {
  const address = app.getDefaultAddress()
  if (!address) {
    app.setDefaultAccount(web3.eth.coinbase)
  } else {
    web3.eth.defaultAccount = address
  }
})