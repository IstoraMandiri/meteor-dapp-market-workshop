Template.landing.events({
  'click .new-market': function (e, tmpl) {
    app.deployContract({
      tmpl: tmpl,
      template: 'marketInfoForm',
      title: 'Create a new market',
      contract: Market
    }, function (err, address) {
      if (err) { throw err }
      FlowRouter.go('market', {address: address})
    })
  },
  'submit form': function (e, tmpl) {
    e.preventDefault()
    var address = $('input', e.target).val()
    if (address) {
      FlowRouter.go('market', {address: address})
    }
  }
})
