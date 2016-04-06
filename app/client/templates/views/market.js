const thisAddress = function () {
  return FlowRouter.getParam('address')
}

Template.market.helpers({
  address: thisAddress,
  ipfsInfoConfig: function () {
    const market = Market.at(thisAddress())
    return {
      getDataMethod: market.IPFSData,
      setDataMethod: market.setIPFSData,
      formTemplate: 'marketInfoForm',
      formTitle: 'Update Market Information',
      userIsOwner: function () {
        return web3.eth.defaultAccount === market.owner.call()
      }
    }
  }
})
