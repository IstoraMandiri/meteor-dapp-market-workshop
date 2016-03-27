Template.landing.events({
  'click .new-market': function (e, tmpl) {
    // before starting let's update the UI to show a loading bar
    TemplateVar.set('deploying', true)
    // deploy the contract
    Market.new({
      // send bytecode in deploy step
      data: Market.bytecode,
      // max-out gas for now to avoid errors
      gas: 3000000
    }, function (err, contract) {
      // this callback fires multiple times
      // alert user if there's a problem
      if (err) {
        // update the template data to hide the
        TemplateVar.set(tmpl, 'deploying', false)
        window.alert(err)
      }
      // if there is no error we shold get a second callback
      // the `address` property will exist after the contract is mined
      if (contract.address) {
        FlowRouter.go('market', {address: contract.address})
      }
    })
  }
})
