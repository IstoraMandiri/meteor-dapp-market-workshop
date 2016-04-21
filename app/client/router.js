// setRoot defines the root DOM node to render stuff in; in our case `body`
BlazeLayout.setRoot('body')

// our landing page (at the base url '/')
FlowRouter.route('/', {
  // a `name` is not required but is useful for organisation
  name: 'landing',
  // the `action` function gets run whenever a user lands on a route
  action: function () {
    // in this case, our action is to render 'mainLayout', passing the string 'landing' as the `main` parameter
    BlazeLayout.render('mainLayout', {main: 'landing'})
  }
})

// similar as above, this time for the `/market/0x123...def` path
FlowRouter.route('/market/:address', {
  name: 'market',
  action: function () {
    // notice that we pass 'market' in here
    BlazeLayout.render('mainLayout', {main: 'market'})
  }
})

FlowRouter.route('/market/:marketAddress/:productAddress', {
  name: 'product',
  action: function () {
    BlazeLayout.render('mainLayout', {main: 'product'})
  }
})
