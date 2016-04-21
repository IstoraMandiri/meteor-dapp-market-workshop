const handleError = function (err) {
  if (err) {
    EZModal(err.toString())
    throw err
  }
}

app.deployContract = function (args, callback) {
  // let's get the IPFS hash first, so we deploy with it already set up for superior UX.
  app.formModal({
    template: args.template,
    title: args.title
  }, function (err, data) {
    handleError(err)
    const sendAmount = data.sendAmount || 0
    delete data.sendAmount
    // update ui
    TemplateVar.set(args.tmpl, 'deploying', true)
    // off it goes to ipfs
    ipfs.addJson(data, function (err, hash) {
      handleError(err)
      // let's see if we have an ethValue
      // deploy the contract, passing hash as the first param
      args.contract.new(hash, {
        // send bytecode in deploy step
        data: args.contract.bytecode,
        // max-out gas for now to avoid errors
        gas: 3000000,
        // the amount we want to send
        value: web3.toWei(sendAmount, 'ether')
      }, function (err, contract) {
        // this callback fires multiple times
        // alert user if there's a problem
        if (err) {
          // update the template data to hide the
          TemplateVar.set(args.tmpl, 'deploying', false)
          handleError(err)
        }
        // if there is no error we shold get a second callback
        // the `address` property will exist after the contract is mined
        if (contract.address) {
          callback(null, contract.address)
        }
      })
    })
  })
}