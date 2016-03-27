# EthMart Tutorial

## Installing prerequisites

This tutorial is created for Mac OSX and Unix

* [Geth](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum)
* [Meteor](http://meteor.com)
* [Meteor-build-client](https://github.com/frozeman/meteor-build-client)

## Building the Dapp

### Initialise your project

Create a new Metoer project using the command line tool, then delete the boilerplate.

```
meteor create app;
cd app;
rm ./*;
```

### Add some packages

Let's get some community packages for use with the app. Run the following:

```
$ meteor remove autopublish insecure
$ meteor add ethereum:web3 ethereum:accounts ethereum:tools silentcicero:solc frozeman:template-var kadira:flow-router kadira:blaze-layout materialize:materialize
```

Your `.meteor/packages` file should look like this (comments added):

```
meteor-base             # Packages every Meteor app needs to have
mobile-experience       # Packages for a great mobile UX
mongo                   # The database Meteor supports right now
blaze-html-templates    # Compile .html files into Meteor Blaze views
session                 # Client-side reactive dictionary for your app
jquery                  # Helpful client-side library
tracker                 # Meteor's client-side reactive programming library
standard-minifiers      # JS/CSS minifiers run for production mode
es5-shim                # ECMAScript 5 compatibility for older browsers.
ecmascript              # Enable ECMAScript2015+ syntax in app code

ethereum:web3           # main web3 library
ethereum:accounts       # accounts info in collection + mongo api
ethereum:tools          # price ticker + balance format
silentcicero:solc       # solidity compiler

frozeman:template-var   # reactive set/get scoped to template
kadira:flow-router      # routing
kadira:blaze-layout     # templating
materialize:materialize # my favourite css framework for prototyping
```

Now that we have our dependencies added, we'll create a layout and some routes for our templates. Eventually our app will look something like:

* Landing page `/`
  * link to default market
  * create a new market
* Market view `/market/:address`
  * market metadata
  * list of items in market (last 10)
  * deploy new escrow contract which updates parent market `/market/:address/new`
* Item view `/market/:address/item/:id`
  * metadata
  * escrow contract
  * buy button

But for now we'll just create one route for a landing page, and build more as we go.

Create `client/templates/layouts/mainLayout.html`. This is the main layout which will container a header, footer and the content of the current route's content.

*mainLayout.html*

```handlebars
<template name="mainLayout">
  {{> navbar}}
  <main>
    <div class="container">
      {{> Template.dynamic template=main}}
    </div>
  </main>
  {{> footer}}
</template>
```

Take a look at `client/components/footer.html` and `navbar.html` for the navbar and footer templates.

We'll also add the landing page itself over at `client/templates/views/landing/landing.html`.

*landing.html*

```handlebars
<template name="landing">
  <br><br>
  <h1 class="header center orange-text">Welcome to EthMart</h1>
  <div class="row center">
    <h5 class="header col s12 light">A Decentralised Marketplace built on Ethereum</h5>
  </div>
  <div class="row center">
    <form class="row">
      <div class="col s12 m9">
        <input type="text" placeholder='Enter Market Address'>
      </div>
      <div class="col s12 m3">
        <button class="btn btn-block waves-effect waves-light orange" type='submit'>Go</button>
      </div>
    </form>
    <div class="row">
      <p>- or -</p>
    </div>
    <div class="row">
      <a href="#" class="btn-large waves-effect waves-light light-blue">Create a new Market</a>
    </div>
  </div>
</template>
```

Now let's wire up these templates to the router.

*router.js*

```js
BlazeLayout.setRoot('body')

FlowRouter.route('/', {
  action: function () {
    BlazeLayout.render('mainLayout', {main: 'landing'})
  }
})
```

Fire up Meteor and visit http://localhost:3000.

```bash
$ meteor
```

You should see a lovely landing page, but it doesn't do anything yet. We want to be able to deploy a new market contract. Let's write it!

*client/contracts/Market.sol*

```solidity
contract Market {

  // public properties, available to be called
  address public owner;
  mapping(uint => address) public items;
  uint public count;
  bytes32 public ipfsData;

  // modifiers can be 'attached' to other functions for convenience
  modifier onlyOnwer()
  {
    if (msg.sender != owner) throw;
    _
  }

  // functions with the same name as the contract get invoked on deployment
  function Market()
  {
    owner = msg.sender;
  }

  // anyone can register an address
  function register(address itemAddress)
  {
    items[count] = itemAddress;
    count++;
  }

  // only admins can set metadata
  function setData(bytes32 ipfsHash)
    onlyOnwer
  {
    ipfsData = ipfsHash;
  }

}
```

This is a basic registry Smart Contract written in solidity. It allows anyone to `register` address, which gets added to a `mapping` called `items`. It also has an `ipfsData` property, which can only be updated by the `owner`, which is set when it is deployed (`function Market`). More on IPFS later.

The package we added earlier caled `silencicero:solc` will automatically compile files ending in `.sol` and add them to the client for us, which lets us interact with them in the console. Let's have a look at it.

*Pop open the chrome javascript console in developer tools*

```javascript
Market
// market contract object
```

In order to deploy this contract, we need to connect to our local geth node first. To do this let's create `client/web3init.js`.

*web3init.js*

```javascript
Meteor.startup(function () {
  // connect to provider
  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))
  // set the default address; must have ether balance to deploy contracts
  web3.eth.defaultAccount = web3.eth.coinbase
})
```

Once Meteor restarts we'll be able to deploy the Market contract using the console.

```javascript
var myMarket = null;
Market.new({data: Market.bytecode, gas: 3000000}, function (err, contract) {
  if (contract.address) {
    myMarket = contract
    console.log('Mined new contract:', myMarket.address)
  }
})
// wait a few seconds for it to be mined...
myMarket.count().toNumber()
// 0
myMarket.register("0x123",{gas:3000000})
// wait a few seconds for this transaction to be miend
myMarket.count().toNumber()
// 1
myMarket.items.call(0)
// "0x0000000000000000000000000000000000000123"
```

Woohoo! Our contact is working!

The next step is to tie this deployment into the UI and then list the registered addresses in a view.

(TODO: continue from here)

---

Let's add some components for a better UX:

```
current account / change account
customisable price ticker for value info
```
