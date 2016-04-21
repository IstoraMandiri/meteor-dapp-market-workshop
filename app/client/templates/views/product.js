const thisProduct = function () {
  return Purchase.at(FlowRouter.getParam('productAddress'))
}

Template.product.helpers({
  contract: thisProduct,
  address: function () {
    return FlowRouter.getParam('productAddress')
  },
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


Template.productInfoForm.helpers({
  deploying: function () {
    return FlowRouter.getRouteName() === 'market'
  }
})

Template.productInfoForm.events({
  'keyup .eth-amount': function (e, tmpl) {
    TemplateVar.set('sendAmount', e.currentTarget.value * 2)
  }
})

