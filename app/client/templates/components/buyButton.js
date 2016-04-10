// original https://github.com/frozeman/example-escrow-dapp/blob/master/client/buyButton.js
// modified version by CTH

var checkState = function (template) {
  template.contract.seller(function (error, seller) {
    if (!error) {
      TemplateVar.set(template, 'seller', seller)
    }
  })
  template.contract.buyer(function (error, buyer) {
    if (!error) {
      TemplateVar.set(template, 'buyer', buyer)
    }
  })
  template.contract.value(function (error, value) {
    if (!error) {
      TemplateVar.set(template, 'value', web3.fromWei(value, 'ether').toString(10))
    }
  })
  template.contract.state(function (error, state) {
    if (!error) {
      TemplateVar.set(template, 'state', +state)
    }
  })
}

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

var callContractMethod = function (tmpl, method, fromAddress, value) {
  if (!tmpl.contract || !_.isFunction(tmpl.contract[method])) {
    return
  }

  TemplateVar.set(tmpl, 'processing', true)

  tmpl.contract[method]({
    from: fromAddress,
    value: web3.toWei(value, 'ether'),
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

Template.buyButton.onCreated(function () {
  const tmpl = this

  // stop here if no contract was given
  if (!tmpl.data || !tmpl.data.contract) {
    return
  }

  // attach contract to the template instance
  tmpl.contract = tmpl.data.contract

  // Load the current contract state
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

Template.buyButton.onDestroyed(function () {
  // stop listening to events when the template gets destroyed
  if (this.handler) {
    this.handler.stopWatching()
  }
})

Template.buyButton.helpers({
  'getState': function (type) {
    return states()[getUser()][TemplateVar.get('state') || 0][type]
  }
})

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
      if (state === 0) {
        callContractMethod(tmpl, 'abort', seller)
      }

      if (state === 1) {
        callContractMethod(tmpl, 'refund', seller)
      }

    // is unknown
    } else {
      if (state === 0) {
        callContractMethod(tmpl, 'confirmPurchase', app.getDefaultAddress(), value * 2)
      }
    }
  }
})
