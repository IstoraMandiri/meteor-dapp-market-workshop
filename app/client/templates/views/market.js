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
