app.getProduct = function (address) {
  return Purchase.at(address)
}

const thisProduct = function () {
  return app.getProduct(FlowRouter.getParam('productAddress'))
}

Template.product.helpers({
  ipfsInfoConfig: function () {
    const product = thisProduct()
    return {
      getDataMethod: product.IPFSData,
      setDataMethod: product.setIPFSData,
      formTemplate: 'productInfoForm',
      formTitle: 'Update Poduct Information',
      updateable: true,
      owner: product.seller.call()
    }
  }
})

Template.product.events({
  'click .back': function () {
    FlowRouter.go('market', {address: FlowRouter.getParam('marketAddress')})
  }
})
