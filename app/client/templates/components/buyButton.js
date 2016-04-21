// thie function will be called whenever a new block is mined
// it'll inject the template state with relevant variables

var checkState = function (template) {
  // get the `seller` address from the contract
  template.contract.seller(function (error, seller) {
    if (!error) {
      // set the seller address
      TemplateVar.set(template, 'seller', seller)
    }
  })
  // get the `buyer` address from the contract
  template.contract.buyer(function (error, buyer) {
    if (!error) {
      //set the buyer address
      TemplateVar.set(template, 'buyer', buyer)
    }
  })
  // get the value of the product
  template.contract.value(function (error, value) {
    if (!error) {
      // set the value (in ether)
      TemplateVar.set(template, 'value', web3.fromWei(value, 'ether').toString(10))
    }
  })
  // get the state itself (Created, Locked or Inactive)
  template.contract.state(function (error, state) {
    if (!error) {
      TemplateVar.set(template, 'state', +state)
    }
  })
}

// getUser will use `EthAccounts` to determine whether the current user is a seller or buyer
var getUser = function () {
  var user = 'unknown'

  if (EthAccounts.findOne({address: TemplateVar.get('buyer'), default: true})) {
    user = 'buyer'
  }

  if (EthAccounts.findOne({address: TemplateVar.get('seller'), default: true})) {
    user = 'seller'
  }

  return user
}

// this function maps the state to an object to populate the button content
var states = function () {
  var value = TemplateVar.get('value') || 0
  return {
    seller: {
      0: {
        class: 'red',
        buttonText: 'Cancel sale of ' + value + ' ETH',
        subText: 'Returns your security deposit of ' + value * 2 + ' ETH'
      },
      1: {
        class: 'red',
        buttonText: 'Refund buyer',
        subText: 'Returns everybodies security deposit of ' + value * 2 + ' ETH'
      },
      2: {
        class: 'grey disabled',
        buttonText: 'Sale Concluded',
        subText: ''
      }
    },
    buyer: {
      0: {
        class: '',
        buttonText: '',
        subText: ''
      },
      1: {
        class: 'green',
        buttonText: 'Confirm received',
        subText: 'Returns security deposit of ' + value + ' ETH'
      },
      2: {
        class: 'grey disabled',
        buttonText: 'Sale Concluded',
        subText: ''
      }
    },
    unknown: {
      0: {
        class: 'green',
        buttonText: 'Buy item for ' + value + ' ETH',
        subText: '+ ' + value + ' ETH security deposit'
      },
      1: {
        class: 'grey disabled',
        buttonText: 'Sale Concluded',
        subText: ''
      },
      2: {
        class: 'grey disabled',
        buttonText: 'Sale Concluded',
        subText: ''
      }
    }
  }
}

// this is wrapper around the contract method
var callContractMethod = function (tmpl, method, fromAddress, value) {
  if (!tmpl.contract || !_.isFunction(tmpl.contract[method])) {
    return
  }
  // update the UI to show it's processing
  TemplateVar.set(tmpl, 'processing', true)

  // call the contact methods
  tmpl.contract[method]({
    from: fromAddress,
    value: web3.toWei(value, 'ether'),
    // max out the gas
    gas: 3000000
  }, function (error, txHash) {
    if (!error) {
      console.log('Transaction send: ' + txHash)
    } else {
      TemplateVar.set(tmpl, 'processing', false)
      console.error("Couldn't send transaciton", error)
      EZModal(error.toString())
    }
  })
}

// `onCreated` event will set up the default state
// it will also use `allEvents` to listen for state changes
Template.buyButton.onCreated(function () {
  const tmpl = this

  // stop here if no contract was given
  if (!tmpl.data || !tmpl.data.contract) {
    return
  }

  // attach contract to the template instance
  tmpl.contract = tmpl.data.contract

  // immediately get the current contract state
  checkState(tmpl)

  // crete an event handler watching relevant events
  tmpl.handler = tmpl.contract.allEvents({fromBlock: 'latest', toBlock: 'latest'}, function (error, log) {
    if (!error) {
      TemplateVar.set(tmpl, 'processing', false)

      // check the state on each new event
      checkState(tmpl)
    }
  })
})

// kill the event handler when the template is removed from the DOM
Template.buyButton.onDestroyed(function () {
  // stop listening to events when the template gets destroyed
  if (this.handler) {
    this.handler.stopWatching()
  }
})

// the `getState` helper returns the relevant content depending on the sate

Template.buyButton.helpers({
  'getState': function (type) {
    return states()[getUser()][TemplateVar.get('state') || 0][type]
  }
})

// when the user clicks the button, we determine what action  to take
// depending on whether they are a buyer or seller.
Template.buyButton.events({
  'click .btn': function (e, tmpl) {
    const buyer = TemplateVar.get('buyer')
    const seller = TemplateVar.get('seller')
    const state = TemplateVar.get('state')
    const value = TemplateVar.get('value')

    // is buyer
    if (EthAccounts.findOne({address: buyer, default: true})) {
      if (state === 1) {
        callContractMethod(tmpl, 'confirmReceived', buyer)
      }

    // is seller
    } else if (EthAccounts.findOne({address: seller, default: true})) {
      // cancel sale
      if (state === 0) {
        callContractMethod(tmpl, 'abort', seller)
      }
      // initiate refund
      if (state === 1) {
        callContractMethod(tmpl, 'refund', seller)
      }

    // is unknown -- neither seller or buyer ; purchase the product
    } else {
      if (state === 0) {
        callContractMethod(tmpl, 'confirmPurchase', app.getDefaultAddress(), value * 2)
      }
    }
  }
})
