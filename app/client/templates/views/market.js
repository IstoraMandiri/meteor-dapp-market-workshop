Template.market.helpers({
  marketInfo: function () {
    const market = Market.at(FlowRouter.getParam('address'))
    return {
      getDataMethod: market.IPFSData,
      setDataMethod: market.setIPFSData,
      formTemplate: 'marketInfoForm',
      formTitle: 'Update Market Information',
      updateable: true,
      owner: market.owner.call()
    }
  }
})

// keep it dry
const thisMarket = function () {
  return Market.at(FlowRouter.getParam('address'))
}

Template.market.events({
  'click .new-product': function (e, tmpl) {
    const market = thisMarket()
    app.deployContract({
      tmpl: tmpl,
      template: 'productInfoForm',
      title: 'Create a new product',
      contract: Purchase
    }, function (err, address) {
      if (err) { throw err }
      FlowRouter.go('product', {marketAddress: FlowRouter.getParam('address'), productAddress: address})
      // update the original market contract in the background
      market.register(address)
    })
  }
})