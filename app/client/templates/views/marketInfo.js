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
    console.log('uio', web3.eth.defaultAccount === Template.instance().market.owner.call())
    return web3.eth.defaultAccount === Template.instance().market.owner.call()
  },
  metadata: function () {
    return TemplateVar.get('metadata')
  }
})

Template.marketInfo.events({
  'click .edit-metadata': function () {
    TemplateVar.set('editing', true)
  },
  'submit form': function (e, tmpl) {
    e.preventDefault()
    // ipfs this ting
    let data = $(e.currentTarget).serializeJSON()
    TemplateVar.set('updating', 'ipfs')
    ipfs.addJson(data, (err, hash) => {
      if (err) { throw err }
      TemplateVar.set(tmpl, 'updating', 'eth')
      let txId = tmpl.market.setData(hash)
      let interval = setInterval(() => {
        if (web3.eth.getTransactionReceipt(txId)) {
          clearInterval(interval)
          TemplateVar.set(tmpl, 'updating', false)
          TemplateVar.set(tmpl, 'editing', false)
          tmpl.getIPFSData()
        }
      }, 500)
    })
  }
})
