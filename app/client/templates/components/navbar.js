Template.navbar.onRendered(function () {
  this.$('.dropdown-button').dropdown({
    constrain_width: false,
    belowOrigin: true
  })
})

Template.navbar.helpers({
  accounts: function () {
    return EthAccounts.find()
  },
  balance: function () {
    return web3.fromWei(web3.eth.getBalance(app.getDefaultAddress()).toNumber(), 'ether')
  }
})

Template.navbar.events({
  'click .select-account': function (e) {
    e.preventDefault()
    app.setDefaultAccount(this.address)
  }
})
