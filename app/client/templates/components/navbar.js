Template.navbar.onCreated(function () {
  Meteor.setInterval(() => {
    TemplateVar.set(this, 'balance', web3.fromWei(web3.eth.getBalance(web3.eth.defaultAccount).toNumber(), 'ether'))
  }, 500)
})
