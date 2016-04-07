app.getProduct = function (address) {
  return Purchase.at(address)
}

const thisProduct = function () {
  return app.getProduct(FlowRouter.getParam('productAddress'))
}

Template.product.helpers({
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
    const sendAmount = e.currentTarget.value * 2
    TemplateVar.set('sendAmount', sendAmount)
    tmpl.find('input[name="sendAmount"]').value = sendAmount
  }
})
