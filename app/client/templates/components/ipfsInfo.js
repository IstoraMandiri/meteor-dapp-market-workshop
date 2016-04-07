// this.config
//  getDataMethod
//  setDataMethod
//  formTemplate
//  formTitle

Template.ipfsInfo.onCreated(function () {
  // call IPFS and get data
  this.getIPFSData = () => {
    let ipfsHash = this.data.config.getDataMethod.call()
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

const handleError = function (err, tmpl) {
  if (err) {
    // update the UI and throw an error
    TemplateVar.set(tmpl, 'error', err)
    throw err
  }
}
Template.ipfsInfo.helpers({
  isUpdatable: function () {
    return this.config.updateable && web3.eth.defaultAccount === this.config.owner
  },
  sendEther: function () {
    return this.config.sendEther
  }
})

Template.ipfsInfo.events({
  'keyup .eth-amount': function (e) {
    console.log(e.currentTarget.value)
  },
  'click .edit-metadata': function (e, tmpl) {
    // create a new modal using the `marketInfoForm` template
    app.formModal({
      template: this.config.formTemplate,
      title: this.config.formTitle,
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
        const txId = this.config.setDataMethod(hash)
        // start polling for the transaction confirmation
        app.trackTransaction(txId, function (err, receipt) {
          handleError(err, tmpl)
          // wait until transaction is mined
          TemplateVar.set(tmpl, 'updating', false)
          TemplateVar.set(tmpl, 'editing', false)
          // now trigger the template to update itself
          tmpl.getIPFSData()
        })
      })
    })
  }
})
