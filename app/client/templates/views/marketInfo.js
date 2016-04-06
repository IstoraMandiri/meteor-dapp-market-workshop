Template.marketInfo.onCreated(function () {
  this.market = Market.at(FlowRouter.getParam('address'))
  // call IPFS and get data
  this.getIPFSData = () => {
    let ipfsHash = this.market.ipfsData.call()
    if (ipfsHash) {
      TemplateVar.set(this, 'loading', true)
      ipfs.catJson(ipfsHash, (err, json) => {
        if (err) { throw err }
        TemplateVar.set(this, 'loading', false)
        TemplateVar.set(this, 'metadata', json)
      })
    } else {
      TemplateVar.set(this, 'loading', false)
    }
  }

  this.getIPFSData()
})

Template.marketInfo.helpers({
  userIsOwner: function () {
    return web3.eth.defaultAccount === Template.instance().market.owner.call()
  }
})

const handleError = function (err, tmpl) {
  if (err) {
    TemplateVar.set(tmpl, 'error', err)
    throw err
  }
}

Template.marketInfo.events({
  'click .edit-metadata': function (e, tmpl) {
    // create a new modal using the `marketInfoForm` template
    app.formModal({
      template: 'marketInfoForm',
      title: 'Update Market',
      data: TemplateVar.get('metadata')
    }, (err, data) => {
      handleError(err, tmpl)
      // update the UI to show a loading indicator
      TemplateVar.set(tmpl, 'updating', 'ipfs')
      // send the data to IPFS
      ipfs.addJson(data, (err, hash) => {
        handleError(err, tmpl)
        // TODO: reflect update type in UI
        TemplateVar.set(tmpl, 'updating', 'eth')
        // create a transaction to update the contract with the new IPFS data hash
        const txId = tmpl.market.setData(hash)
        // start polling for the transaction confirmation
        const interval = setInterval(() => {
          // once we get a transaction receipt...
          if (web3.eth.getTransactionReceipt(txId)) {
            // stop polling
            clearInterval(interval)
            // and update the UI
            TemplateVar.set(tmpl, 'updating', false)
            TemplateVar.set(tmpl, 'editing', false)
            // now trigger the template to update itself
            tmpl.getIPFSData()
          }
        }, 500)
      })
    })
  }
})
