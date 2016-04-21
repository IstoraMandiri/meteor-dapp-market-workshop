// onCreated gets called whenever the template is created
Template.ipfsInfo.onCreated(function () {
  // define getIPFSData
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
  // call it
  this.getIPFSData()
})

// is the metadata updateable?
Template.ipfsInfo.helpers({
  isUpdatable: function () {
    // yes, if we pass an `updateable` param and the owner is the default web3 account
    return this.config.updateable && app.getDefaultAddress() === this.config.owner
  }
})

// Don't Repeat Yourself: update the UI and throw an error
const handleError = function (err, tmpl) {
  if (err) {
    TemplateVar.set(tmpl, 'error', err)
    throw err
  }
}

// handle the click event on 'edit metadata'
Template.ipfsInfo.events({
  'click .edit-metadata': function (e, tmpl) {
    // spawn a form modal
    app.formModal({
      template: this.config.formTemplate,
      title: this.config.formTitle,
      // populate the form's data with the current IPFS data
      data: TemplateVar.get('metadata')
    }, (err, data) => {
      handleError(err, tmpl)
      // update the UI to show a loading indicator
      TemplateVar.set(tmpl, 'updating', true)
      // send the data to IPFS
      ipfs.addJson(data, (err, hash) => {
        handleError(err, tmpl)
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
