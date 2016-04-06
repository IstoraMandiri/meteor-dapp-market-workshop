// returns a newly deployed contract address
// args:

// tmpl
// template
// title
// contract

app.deployContract = function (args, callback) {
  // let's get the IPFS hash first, so we deploy with it already set up for superior UX.
  app.formModal({
    template: args.template,
    title: args.title,
    // returns raw data by default or ipfs hash if true
    ipfs: true
  }, function (err, hash) {
    if (err) { throw err }
    TemplateVar.set(args.tmpl, 'deploying', true)
    // deploy the contract, passing hash as the first param
    args.contract.new(hash, {
      // send bytecode in deploy step
      data: args.contract.bytecode,
      // max-out gas for now to avoid errors
      gas: 3000000
    }, function (err, contract) {
      // this callback fires multiple times
      // alert user if there's a problem
      if (err) {
        // update the template data to hide the
        TemplateVar.set(args.tmpl, 'deploying', false)
        window.alert(err)
      }
      // if there is no error we shold get a second callback
      // the `address` property will exist after the contract is mined
      if (contract.address) {
        callback(null, contract.address)
      }
    })
  })
}
