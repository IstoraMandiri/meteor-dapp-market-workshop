BlazeLayout.setRoot('body')

FlowRouter.route('/', {
  action: function () {
    BlazeLayout.render('mainLayout', {main: 'landing'})
  }
})
