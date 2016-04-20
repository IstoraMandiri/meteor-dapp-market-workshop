# EthMart Tutorial

EthMart is a simple Decentralized Application (Dapp) that allows users to create Markets and list Products for sale. Other users can purchase these products, facilitated by a deposit-based Smart Contract escrow.

This tutorial is designed to introduce the foundational elements of dapp development with Ethereum and will result in the creation of a production ready (albeit very simple) decentralized app.

### Prerequisites

This tutorial was designed for Mac OSX or Ubuntu. Please complete the setup guide (SETUP.md) before beginning.

### Building the Dapp

We're going to start from scratch and be guided through follow the following main steps:

0. Specification
1. Initialise your Meteor Project
2. Connecting to an Ethereum Testnet
3. Market Smart Contract
4. Routing
5. Deployment UI
6. Market Metadata - IPFS
7. Create a Reusable Deploy Step
8. Deploying Products
9. Product Listings
10. Accounts Switching

## 0. Specification

But before we start with all that - let's be a bit more *spec*ific about what we plan build. 

For non-trivial projects, it's usually best to spec each feature you build as you go in a series of tests (written in code) before you actually write that feature's code. In this tutorial, though, we're skipping the unit tests so we can get our hands dirty quickly. 

For clarity, though, I'll briefly spec out the project in written English in SPEC.md

This could also be expressed more briefly:

* **Market Managers** can Create and Edit Markets
    * **Create a Market** Landing Page -> Click 'New Market' -> Enter Metadata -> Taken to Market
    * **Edit a Market** Market Page -> Click 'Edit Metadata' -> Enter Metadata -> Market Updated
* **Sellers** can Create and Edit Products and Issue Refunds
    * **Create a Product** Market Page -> Click 'New Product' -> Enter Price & Metadata -> Taken to Product
    * **Edit a Product** Product Page -> Click 'Edit Metadata' -> Enter Metadata -> Product Updated
    * **Cancel Sale** Product Page -> Click 'Cancel' -> Sale Ended
    * **Issue Refund** Product Page -> Click 'Refund' -> Sale Ended
* **Buyers** can Purchase Products
    * **Purchase** Product Page -> Click 'Buy it now' -> Become Buyer
    * **Confirm Receipt** Product Page -> Click 'Confirm Receipt' -> Sale Ended

So now we've described what our app is going to do, let's get to building it.

## 1. Initialise your Meteor Project

To kick off, create a new Meteor project using the command line tool. Meteor will create a new project folder with some boilerplate files in, but we can remove them.

```bash
# meteor init
meteor create ethmart
# enter project directory
cd ethmart
# delete the boilerplate
rm -rf client server
```

### Project Structure

In Meteor, files are automatically compiled and bundled together depending on which folder they appear in.

Files in the `/client` folder will only be sent to the browser, files in `/server` will be bundled for the server only, and files anywhere else will be available on both the server and client (thanks JavaScript!). You can use any style of folder nesting you like; Meteor will bundle files together with files appearing in any `/lib` folder being loaded first.

Because we're using Meteor to build a decentralised app, we don't need any server side code, so all of our source code in this tutorial will be placed in the `/client` folder.

In the end our project will look something like:

```bash
# the `client` folder contains files that get bundled for the browser
client/
  router.js
  contracts/
  helpers/
  lib/
  templates/
    components/
    layouts/
    views/
# The hidden `.meteor` folder contains Meteor project metadata
.meteor/
  packages
  versions
  release
```

Using this structure in Meteor isn't essential, but it's a very common pattern, and using it will make it easier to manage our project as it grows. Feel free to create this folder structure now, or just build it out as we go.


### Packages

Meteor is all about packages - standardized libraries for doing various cool things. There is a huge package ecosystem for Meteor - many specifically created for use with Ethereum. Usually we would add each package when we need it, but for the sake of speed let's add them all at the same time now.

```
$ meteor remove autopublish insecure
$ meteor add TODO LIST PACKAGES
```

Your `.meteor/packages` file should look like this (comments added):

```
TODO ADD FINAL PACKAGE LIST
```

You can find community-built packages for basically everything over at https://atmospherejs.com/

## 2. Connecting to an Ethereum Testnet

We'll want to start looking at contracts and understanding how they fit in. But before we can properly interact with the contracts in our browser, we need to connect to an Ethereum node.

### Picking the Right Network

There are a few different types of network we could connect to:

* Public Mainnet (unpermissioned)
* Private Mainnet (permissioned)
* Public Testnet (aka Morden)
* Private Testnet (good for prototyping)

As we're still prototyping, for now we probably want to use a private testnet for deploying and iterating. A private testnet is great because:

* You don't need to connect to other peers (you can develop with no internet)
* You get to mine every block
* Block times are shorter
* Mining automatically accrues test Ether (tEther)

Basically, for what we're doing it's a no-brainer to use a private testnet for day-to-day development. We can always move to another network once we're ready to go live. What about for staging and production? We'll get to that later.

`geth` has a lot of command line options which you're encouraged to discover for yourself. For now, you can use the handy script in the scripts folder:

```bash
./scripts/blockchain/start-blockchain.sh
```

This script will start `geth` with some pre-configured settings:

* Automatically create a dev account
* Clever Mining Script (only mine when needed)
* Enable JSON RPC on port 8545
* Wildcard CORS Whitelist
* Custom Genesis Block
* `--dev` mode (skips DAG creation and displays EVM output in console)

If you want to attach the console to this node, you'll need to use:

```
# `cd` into the parent folder of `scripts`
geth attach ipc://$PWD/scripts/blockchain/tmp/geth.ipc
```

With an attached console, we can interact with the `geth` node.

```bash
> eth.accounts
["0x123...def"]
# the parameter here determines the number of CPUs to use
> miner.start(2)
true
> miner.stop()
true
> eth.blockNumber
12
```

### Connecting in the Browser

Now we've got a node running on port 8545, we can connect to it in the browser. Let's automatically connect whenever the app starts. First, though, we need to add `web3` - the Ethereum Javascript library. To do this, let's use Meteor's new NPM feature:

```bash
meteor npm install --save web3 meteor-node-stubs
```

After a few moments the `web3` library should be added. If we `import` this package on the client, Meteor will browserify it automatically for us and make it available in the browser. Let's do that by creating:

`client/lib/init.js`

```javascript
// create global `app` namespace
window.app = window.app || {}
// es6 import - notice the capitalized Web3
import Web3 from 'web3'
// initialize web3
window.web3 = new Web3()
// set the provider to our local dev node
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))
```

There we have it. 

Now we can fire up `meteor` and visit our app (http://localhost:3000/), open the JavaScript console in chrome (usually `shift + command + i` or `F12`), and start interacting:

```
web3
// outputs web3 object
web3.eth.accounts
// ["0x123...def"]
web3.eth.blockNumber
// 14
```

Great! We're connected.

## 3. Market Smart Contract

Now we're connected we can start playing with Smart Contracts. We need to understand how they work and what their API is in order to build a relevant user interface.

Go ahead and create our (more basic of the two) Market.sol contract:

`client/contracts/Market.sol`

```solidity
contract Market {

  // public properties, available to be called
  address public owner;
  mapping(uint => address) public items;
  uint public count;
  string public IPFSData;

  // modifiers can be 'attached' to other functions for convenience
  modifier onlyOnwer()
  {
    if (msg.sender != owner) throw;
    _
  }

  // functions with the same name as the contract get invoked on deployment
  function Market(string IPFSHash)
  {
    // set the owner address
    owner = msg.sender;
    // set the default hash if it's provided
    IPFSData = IPFSHash;
  }

  // anyone can register an address
  function register(address itemAddress)
  {
    items[count] = itemAddress;
    count++;
  }

  // only admins can set metadata
  function setIPFSData(string IPFSHash)
    onlyOnwer
  {
    IPFSData = IPFSHash;
  }

}
```

This is a basic registry Smart Contract written in Solidity. It allows any Ethereum address to `register` an address, which gets added to a `mapping` called `items`. It also has an `ipfsData` property, which can only be updated by the `owner` of that market, which is set when it is deployed (`function Market`). More on IPFS later.

For metoer to understand how to deal with `.sol` files, let's add a new package:

```
meteor add silentcicero:solc
```

This package will automatically compile files ending in `.sol` and add them to the client for us, which lets us interact with them in the console. Save the contract source code and let's have a look at it.

```javascript
// in chrome dev tools, enter:
Market.bytecode
// outputs EVM bytecode
console.table(Market.abi)
// outputs Application Binary Interface (ABI)
// the ABI is used to generate relevant JavaScript methods.
```

Coolio, it's *compiled* - but it's not *deployed* yet. It doesn't exist on the blockchain.

Let's set up our `defaultAccount` to be the same as `coinbase`. Coinbase is where our mining reward will go to, so we should already have some Ether at that address to get us going (it costs Ether to deploy).

`client/lib/init.js`

```javascript
Meteor.startup(function () {
  web3.eth.defaultAccount = web3.eth.coinbase
})
```

Once Meteor restarts we'll be able to deploy the Market contract using the console.

```javascript
// in chrome console
var myMarket = null;
Market.new({data: Market.bytecode, gas: 3000000}, function (err, contract) {
  if (contract.address) {
    myMarket = contract
    console.log('Mined new contract:', myMarket.address)
  }
})
// you should see your `geth` client whizzing
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

But we can't have our users deploy their markets using the console. The next step is to tie the contract into our UI.

## 4. Routing

Now it's time to start building out the user interface of our dapp. We'll start by create a main **layout** and then some **routes** which will render our **views**.

### A bit of Terminology

In Meteor, a **template** is a general term for specific chunk of HTML used within a layout, view or component. Meteor's default rendering engine *Blaze* uses *Handlebars.js* as it's template engine - so we'll be using handlebars templates in this tutorial (but Meteor can support many other temlpating engines like React, Angular or IMBA). 

Typically a `templateName.html` template file will have a corresponding `templateName.js` file, containing logic related to that template.

A **layout** is a template that can contain a number of different views and typically 'surrounds' whatever is being rendered for a particular route. It might contain a main menu, header and footer, or other markup you don't want to repeat again and again for every route. It's best to use layouts to cut down on repeated markup and to keep things DRY.

A **route** is a specific area or page - usually with a unique URL path. In our case, our app will have the following routes: 

* Landing page `/`
* Market view `/market/:address`
* Item view `/market/:marketAddress/:productAddress`

The colon-prefixed `:parameters` in the paths above indicate where an ID string will go (e.g. `/market/0x123...def`).

**Views** are usually described as templates that are tied to a specific route, which determine the unique UI and behaviour of a given route. 

We'll be using the routing package `FlowRouter` to define our 3 **routes**, which will each render a unique **view** within the same 'main' **layout**.

### Get Routing

Before we begin, we need to add some packages:

```
meteor add materialize:materialize kadira:flow-router kadira:blaze-layout frozeman:template-var
```

First we'll create the main layout which will container a header, footer and the content of the current route's template.

`client/templates/layouts/mainLayout.html`

```handlebars
<template name="mainLayout">
  {{> navbar}}
  <main>
    <div class="container">
      {{> Template.dynamic template=main}}
    </div>
  </main>
</template>
```

This is a handlebars template. It's similar to HTML, but with some extra features. Using `{{> someTemplateName}}` in a handlebars template will cause the template named `someTemplateName` to be rendered in place. This 'include' feature allows us to easily organise our markup into modular components.

Let's add a navbar header:

`client/tempaltes/components/navbar.html`

```handlebars
<template name="navbar">
  <nav class="light-blue lighten-1" role="navigation">
    <div class="nav-wrapper">
      <a href="/" class="brand-logo center">EthMart</a>
    </div>
  </nav>
</template>
```

The `{{> Template.dynamic template=main}}` line in `mainLayout.html` a 'dynamic template include'. We're passing in a `main` variable which will determine which view to render -- let's wire this up in our router.

`client/router.js`

```js
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
```

Now let's add placeholder views to be rendered at each route:

`client/templates/view/landing.html`

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
      <div class="btn-large waves-effect waves-light light-blue new-market">Create a new Market</div>
    </div>
  </div>
</template>
```
`client/templates/view/market.html`
```handlebars
<template name="market">
  <p>Market View</p>
</template>
```
`client/templates/view/product.html`
```handlebars
<template name="product">
  <p>Product View</p>
</template>
```

You should now be welcomed by your landing page and you can now visit all 3 routes:

* Landing Page [http://localhost:3000/](http://localhost:3000/)
* Market Route [http://localhost:3000/market/abc](http://localhost:3000/market/abc)
* Product Route [http://localhost:3000/market/abc/123](http://localhost:3000/market/abc/123)

As you can see Meteor makes it very simple to start developing single page applications. We've got an underlying structure for our app and can build out from here with business logic and UI.

## 5. Deployment UI

Remember above when we deployed the Market contract from the JS console? We're going do exactly that, but this time when a user clicks on a 'Create a New Market' button on the landing page. Once the contract is mined we'll automatically forward the user to that market's route.

Modify the landing page markup; adding a button for the deploy event as well as showing a progress indicator.

`client/templates/views/landing.html`

```html
  {{#if TemplateVar.get "deploying"}}
    <div class="row">
      <p class="teal-text">Deploying Market Contract...</p>
      <div class="progress">
        <div class="indeterminate"></div>
      </div>
    </div>
  {{else}}
    <!-- ... -->
    <!-- Make sure we have `new-market` class on the new market button -->
    <div class="btn-large waves-effect waves-light light-blue new-market">Create a new Market</div>
    <!-- ... -->
  {{/if}}
```

The `{{#if TemplateVar ...` block will render if `deploying` is true. Otherwise, we'll show the 'Crete a new Market' button, which should be showing by default (as we haven't set `deploying` yet).

Let's add deployment logic to the `click` event.

`client/templates/view/landing.js`

```javascript
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
  },
  ...
```
While we're at it we might as well wire up the `submit form` event so users can navigate to an existing market.
```
  ...
  'submit form': function (e, tmpl) {
    e.preventDefault()
    var address = $('input', e.target).val()
    if (address) {
      FlowRouter.go('market', {address: address})
    }
  }
})
```

And let's edit our market template to get the address:

`client/templates/views/market.html`

```handlebars
<template name="market">
  <h3>Market Route</h3>
  <p>Address: {{address}}</p>
</template>
```

`client/templates/views/market.js`

```javascript
Template.market.helpers({
  address: function () {
    return FlowRouter.getParam('address')
  }
})
```

Now we can click the 'create new market' button on the landing page and see a beautiful loading bar followed by a less beautiful market route.

If you want to play with a deployed contract in the JS console, you can do so with:

```javascript
var myMarket = Market.at('0x123...def')
// then take a look at the methods
myMarket.register("0x123",{gas:3000000})
```

## 6. Market Metadata - IPFS

This section is big. Pour yourself a coffee. If you want to skip this step, you can do TODO. 

The next requirement we need to implement is having a description for the market. Now, we could write all of our data to the Ethereum blockchain; embedded in the contract itself. This, unfortunately, has some downsides:

* It's expensive to save data on the blockchain; prohibitively expensive to save lots of data
* There is an upper gas limit for each transaction; if there's too much data we need to split it into multiple transactions. Annoying to manage

Really, we want to save an arbitrary amount of data in potentially different formats; what if I want a High Definition video demo of the item I'm selling to appear next to the item? Way too big for the Ethereum public blockchain.

For that reason, it makes more sense to saving a link to the data rather than the data itself. A URL is short but can contain a virtually infinite amount of content. If we wanted to, we could use a Web 2.0 URL, and have the app pull from that URL. But that's kind of a centralized solution and can be shut down - we'd also need to build a webservice for people uploading the content. It defeats the purpose of the app if we have any central point of failure.

### Introducing IPFS

Luckily, we have an alternative: it's time for the InterPlanetary FileSystem (IPFS).

You can learn more about IPFS in THEORY.md. Long story short, it's a magical system that can convert arbitrary data into a universally accessible hash. That hash is exactly 46 characters regardless of the data it contains. We can save that IPFS hash in the contract without having to worry about the amount of data being saved. Perfect!

Let's add IPFS to our project.

```bash
meteor npm install ipfs-js --save
```

Make sure your IPFS node is running with the correct config:

```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000", "http://localhost:5001"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
ipfs daemon
// You can reset this configuration afterwards using:
// ipfs config --json API.HTTPHeaders {}
```

And now let's initialize IPFS

`client/lib/init.js`

```javascript
// connect to ipfs (local ipfs daemon)
import ipfs from 'ipfs-js'
window.ipfs = ipfs
ipfs.setProvider()
```

The `ipfs-js` library gives some nice helpers to simply put and get from IPFS. Let's play in the browser console:

```javascript
var myJSON = {'test': 'huzzah!'}
ipfs.addJson(myJSON, function(err,hash){
  console.log('put to IPFS', hash)
  ipfs.catJson(hash, function(err,json){
    console.log('got from IPFS', json)
  })
})
```

Working? Good. Easy, right? 

Now, let's integrate these `addJson` and `catJson` methods in our app. The next logical step is to create a way adding JSON metadata to IPFS, retrieving the IPFS hash, and saving that hash to the market contract.

### Create a Reusable Component 

Now's a great time to create a *reusable component*. We're going to design a self-contained component that will do the following for any arbitrary data:

* Gets IPFS hash from contract, gets data from IPFS, and displays it in a custom HTML format
* Adds an 'Edit Metadata' button if the user is the owner
* Shows a custom 'edit data' form when the button is clicked
* Hijack the form's 'submit' event, serialize the data, send to IPFS and retrieve the IPFS hash
* Update the contract's IPFS hash

We don't know the model of the metadata so ideally it shouldn't be hard-coded. Let's use templates to define what the data will be - our component should just save arbitrary JSON depending what fields appear in the form.

We'll structure this component into some logical elements:

* `formModal.js` Spawns a popup containing a `<form>` and returns the forms' JSON data when submitted
* `trackTransaction.js` A small helper for checking the status of the 'update ipfs hash' transaction
* `ipfsInfo.js` Handles logic for retreiving data and updating contract (with option to pass in the methods)
* `ipfsInfo.html` Shows a loading indicator and the IPFS data when it's loaded

Our component will depend on a couple of packages; a helper for spawning modals, and a form serializer:

```
meteor add hitchcott:ez-modal pcel:serialize
```

First let's create the `formModal.js` helper, which will spawn a popup with the template we specify and return that template's data in JSON format. It's arguments are:

* `template` - the form template
* `title` - header of modal
* `data` - data context for modal

`client/helpers/formModal.js`

```javascript
// attach to `app` namespace
app.formModal = function (args, callback) {
  if (!args.template) {
    throw Error('Template undefined')
  }
  let modalData = {
    bodyTemplate: args.template,
    dataContext: args.data,
    title: args.title,
    fixedFooter: true,
    leftButtons: [{
      html: 'Cancel'
    }],
    rightButtons: [{
      html: 'Submit',
      fn: function (e, tmpl) {
        // trigger HTML5 validation
        $(tmpl.find('input[type="submit"]')).click()
      }
    }]
  }
  // spawn the modal
  const $thisModal = EZModal(modalData)
  // initialize materialize textareas.
  $('textarea', $thisModal).trigger('autoresize')
  // wire up HTML5 validation by injecting 'submit' element
  const $thisModalForm = $('.modal-content form', $thisModal)
  $thisModalForm.append('<input type="submit" class="hide"/>')
  // override submit event and callback if valid
  $thisModalForm.on('submit', function (e) {
    e.preventDefault()
    // by now we are valid - return the serialized data
    callback(null, $thisModalForm.serializeJSON())
    // bye bye
    $thisModal.closeModal()
  })
  return $thisModal
}
```

There's also additional logic to take advantage of HTML5 validation and Materialize forms. 

Next, let's create the relatively simple `trackTransaction.js`. It accepts a transaction address and returns a callback when the transaction is mined.

`client/helpers/trackTransaction.js`

```javascript
app.trackTransaction = function (txId, callback) {
  const interval = setInterval(() => {
    // once we get a transaction receipt...
    const txReceipt = web3.eth.getTransactionReceipt(txId)
    if (txReceipt) {
      // stop polling
      clearInterval(interval)
      // callback
      callback(null, txReceipt)
    }
  }, 500)
}
```

### Block Helpers

In Meteor there is the concept of 'Block Helpers'. They work like this:

```handlebars
<template name='myHelper'>
  <table>
    <tr>
      {{> UI.contentBlock}}
    </tr>
  </table>
</template>

<template name='someView'>
  <main>
    <h1>Some Title</h1>
    {{#myHelper}}
      <td>Name</td>
      <td>Bob</td>
    {{/myHelper}} 
  </main>
</template>
```

Basically, they'll wrap a bit of content with some other template, a bit like an inline layout. The cool part is that we can program log into our block helper that injects data into the `contentBlock` we pass into it.

This is perfect for integrating something like, I dunno, a template that automatically pulls it's data from an IPFS hash.

Now on to the main event: `ipfsInfo.html` and `ipfsInfo.js`

Fist the markup:

`client/templates/components/ipfsInfo.html`

```handlebars
<template name="ipfsInfo">
  {{#if TemplateVar.get "loading"}}
    <p>Loading...</p>
  {{else}}
    {{#if isUpdatable}}
      <div class="row right-align">
        {{#if TemplateVar.get "updating"}}
          <p class='teal-text'>Updating Metadata...</p>
          <div class="progress">
            <div class="indeterminate"></div>
          </div>
        {{else}}
          <div class="btn teal edit-metadata">Edit Metadata</div>
        {{/if}}
      </div>
    {{/if}}
    <div class="clearfix"></div>
    {{#with TemplateVar.get "metadata"}}
      {{> UI.contentBlock .}}
    {{else}}
     <p>Couldn't fetch data.</p>
    {{/with}}
  {{/if}}
</template>
```

Fairly straight forward here. We're using `TempalteVar` display the correct markup depending on the state, which we'll define below. The important part here is `{{> UI.contentBlock .}}`, which will allow us to wrap the HTML we want to render like:

```handlebars
{{#ipfsInfo}}
  <h1>{{title}}</h1>
  <h2>{{arbitraryField}}</h2>
{{/ipfsInfo}}
```

On to the component logic:

`client/templates/components/ipfsInfo.js`
```
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

// is thie metadata updateable?
Template.ipfsInfo.helpers({
  isUpdatable: function () {
    // yes, if we pass an `updateable` param and the owner is the default web3 account
    return this.config.updateable && web3.eth.defaultAccount === this.config.owner
  }
})

// update the UI and throw an error
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
```

Phew. Quite a lot to take in there.

What we end up is a nice interface for including IPFS data and making it easily updated using our component. We can use it by passing, along with the HTML block, a `config` object with the following arguments:

* `getDataMethod` Contract method to call for getting data
* `setDataMethod` Contract method to call for setting data
* `formTemplate` The template used for the form popup
* `formTitle` Title of the form popup
* `updateable` Boolean - whether or not the metadata icon appears if user is the owner
* `owner` Address of the owner to match against

Let's implement it now. But first, markdown support!

```
meteor add showdown
```

`client/templates/views/market.html`

```
<template name="market">
  {{#ipfsInfo config=marketInfo}}
    <h3>
      {{title}} <br> <small>{{address}}</small>
    </h3>
    {{#markdown}}{{description}}{{/markdown}}
  {{/ipfsInfo}}
</template>

<template name="marketInfoForm">
  <form>
    <div class="row">
      <div class="col input-field s12">
        <input name="title" type="text" class='validate' placeholder="Market Name" value="{{title}}" required>
        <label for="name" class='active'>Market Name</label>
      </div>
    </div>
    <div class="row">
      <div class="col input-field s12">
        <textarea name="description" class="materialize-textarea  validate" placeholder="Description" required>{{description}}</textarea>
        <label for="description" class='active'>Description - Markdown Supported</label>
      </div>
    </div>
  </form>
</template>
```

`client/templates/views/market.js`

```javascript
Template.market.helpers({
  marketInfo: function () {
    const market = app.getMarket(FlowRouter.getParam('address'))
    return {
      getDataMethod: market.IPFSData,
      setDataMethod: market.setIPFSData,
      formTemplate: 'marketInfoForm',
      formTitle: 'Update Market Information',
      updateable: true,
      owner: market.owner.call()
    }
  }
})
```

Testing this out, we can now deploy markets and dynamically edit their metadata!

## 7. Create a Reusable Deploy Step

So now we have a nice reusable IPFS form editor, the next logical thing to do is deploy our `Purchase` contracts into market products. That logic is going to look extremely similar to what we did earlier on the landing page. 

Moreover, it makes sense in terms of UX to have the user input the meteadata *before* deploying - combining those steps (deploying and editing metadata) into one. Did you notice that the `Market` and `Purchase` contract both contain an `ipfsHash` field in the constructor functions? This means we can pass in an IPFS hash when we deploy.

Let's tweak our landing deploy logic to make use of our form data component:

`client/templates/views/landing.js`

```javascript
// ...
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
// ...
```

`client/helpers/deployContract.js`
```javascript
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
```

As you can see, we're pulling out the `new` method (for deploying) and combining it with the `formModal`, with a similar IPFS hash getter as before. Now whenever we deploy a contract we just need to use logic similar to `landing.js`.

## 8. Deploying Products

Speaking of deploying other contracts - our market need some products. Luckily all the work we did decoupling the deploy step will pay off here, as we simply need to call it again with different parameters to deploy the contract.

First let's add the *Purchase* aka *Escrow* aka *Product* contract itself:

`client/contracts/purchase.sol`

```solidity
contract Purchase {
    uint public value;
    address public seller;
    address public buyer;
    enum State { Created, Locked, Inactive }
    State public state;
    string public IPFSData;

    /// Create a new locked purchase about
    /// `msg.value / 2` Wei.
    function Purchase(string IPFSHash)
        require(msg.value % 2 == 0)
    {
        seller = msg.sender;
        value = msg.value / 2;
        IPFSData = IPFSHash;
    }

    modifier require(bool _condition)
    {
        if (!_condition) throw;
        _
    }
    modifier onlyBuyer()
    {
        if (msg.sender != buyer) throw;
        _
    }
    modifier onlySeller()
    {
        if (msg.sender != seller) throw;
        _
    }
    modifier inState(State _state)
    {
        if (state != _state) throw;
        _
    }

    event Aborted();
    event PurchaseConfirmed();
    event ItemReceived();
    event Refunded();

    /// Abort the purchase and reclaim the ether.
    /// Can only be called by the seller before
    /// the contract is locked.
    function abort()
        onlySeller
        inState(State.Created)
    {
        seller.send(this.balance);
        state = State.Inactive;
        Aborted();
    }
    /// Confirm the purchase as buyer.
    /// Transaction has to include `2 * value` Wei.
    /// The ether will be locked until either
    /// confirmReceived is called by the buyer
    /// or refund is called by the seller.
    function confirmPurchase()
        inState(State.Created)
        require(msg.value == 2 * value)
    {
        buyer = msg.sender;
        state = State.Locked;
        PurchaseConfirmed();
    }
    /// Confirm that you (the buyer) received the item.
    /// This will send `value` to the buyer and
    /// `3 * value` to the seller.
    function confirmReceived()
        onlyBuyer
        inState(State.Locked)
    {
        buyer.send(value); // We ignore the return value on purpose
        seller.send(this.balance);
        state = State.Inactive;
        ItemReceived();
    }
    /// Fully refund the buyer. This can only be called
    /// by the seller and will send `2 * value` both to
    /// the buyer and the sender.
    function refund()
        onlySeller
        inState(State.Locked)
    {
        buyer.send(2 * value); // We ignore the return value on purpose
        seller.send(this.balance);
        state = State.Inactive;
        Refunded();
    }

    // only admins can set metadata
    function setIPFSData(string IPFSHash)
        onlySeller
    {
        IPFSData = IPFSHash;
    }


    function() { throw; }
}
```

We can look at these methods in detail a bit later. The important part is that we have `IPFSData` that gets set when constructed.

Let's add some markup - the form first:

`client/templates/views/product.html`

```handlebars
<template name="productInfoForm">
  <form>
    {{#if deploying}}
      <div class="row">
        <div class="col input-field s12">
          <input step='0.0001' class="eth-amount" type="number" placeholder="Product Cost in ETH" required>
          <input name="sendAmount" type="hidden" value="{{TemplateVar.get 'sendAmount'}}" required>
          <label for="name" class='active'>Product Price</label>
          {{#if TemplateVar.get 'sendAmount'}}
            <p>Deposit price: <b>{{TemplateVar.get 'sendAmount'}} ETH</b></p>
          {{/if}}
        </div>
      </div>
    {{/if}}
    <div class="row">
      <div class="col input-field s12">
        <input name="title" type="text" placeholder="Product Name" value="{{title}}" required>
        <label for="name" class='active'>Product Name</label>
      </div>
    </div>
    <div class="row">
      <div class="col input-field s6">
        <input name="image" type="text" placeholder="Image URL" value="{{image}}">
        <label for="name" class='active'>Image</label>
      </div>
      <div class="col input-field s6">
        <input name="icon" type="text" placeholder="Materialize Icon" value="{{icon}}">
        <label for="name" class='active'><a href="http://materializecss.com/icons.html" target="_blank">Materialize</a> Icon</label>
      </div>
    </div>
    <div class="row">
      <div class="col input-field s12">
        <textarea name="description" class="materialize-textarea" placeholder="Description">{{description}}</textarea>
        <label for="description" class='active'>Description - Markdown Supported</label>
      </div>
    </div>
  </form>
</template>
```

What's this `deploying` block? Basically, we're creating a special hidden field that will pass `sendAmount` to the `deployContract` method. That in turn becomes a web3 `value` parameter - which is used to send Ether to a contract. The escrow contract uses this amount as the seller's deposit, meaning the item's value should always be exactly half. We dynamically calculate this value as the user is typing.

We've also added this 'icon' field, which we'll need to import materialize icons for:

`client/head.html`

```html
<head>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
```

It only gets called when `deploying` is true (when we're on a market route), so it isn't set when simply updating product metadata (on the product route).

`client/templates/views/product.js`

```
Template.productInfoForm.helpers({
  deploying: function () {
    return FlowRouter.getRouteName() === 'market'
  }
})

Template.productInfoForm.events({
  'keyup .eth-amount': function (e, tmpl) {
    const sendAmount = e.currentTarget.value * 2
    TemplateVar.set('sendAmount', sendAmount)
  }
})
```

Which we can pass into our product deploy event:

`client/templates/views/market.js`

```
// keep it dry
const thisMarket = function () {
  return Market.at(FlowRouter.getParam('address'))
}

Template.market.events({
  'click .new-product': function (e, tmpl) {
    const market = thisMarket()
    app.deployContract({
      tmpl: tmpl,
      template: 'productInfoForm',
      title: 'Create a new product',
      contract: Purchase
    }, function (err, address) {
      if (err) { throw err }
      FlowRouter.go('product', {marketAddress: FlowRouter.getParam('address'), productAddress: address})
      // update the original market contract in the background
      market.register(address)
    })
  }
})
```

Notice that it's slightly different from before -- we're using `market.register` at the end, which registers our product contract address to the market.

Now we need to add the deploy button to the market template:

`client/templates/views/market.html`

```
{{#if TemplateVar.get "deploying"}}
  <div class="row">
    <p class='teal-text'>Deploying New Product Contract...</p>
    <div class="progress">
      <div class="indeterminate"></div>
    </div>
  </div>
{{else}}
  <div class="left btn orange new-product">New Product</div>
{{/if}}
```

Yeah! There we go. Now we're deploying products, which gets registered to their parent market!

Let's fix up the product page with it's metadata:

`client/templates/views/product.html`

```
<template name="product">
  <br>
  <div class="left btn grey back">Back</div>
  {{#ipfsInfo config=ipfsInfoConfig}}
    <div class="row">
      <div class="col m5 s12 center-align">
        <img src="{{image}}" alt="" class="circle responsive-img">
        <!-- TODO Buy Button -->
      </div>
      <div class="col m7 s12">
        {{#if icon}}
          <i class="right large material-icons">{{icon}}</i>
        {{/if}}
        <h1>{{title}}</h1>
        <h4 class='truncate'>{{address}}</h4>
        {{#markdown}}{{description}}{{/markdown}}
      </div>
    </div>
  {{/ipfsInfo}}
</template>
```

`client/templates/views/product.js`

```
const thisProduct = function () {
  return Purchase.at(FlowRouter.getParam('productAddress'))
}

Template.product.helpers({
  address: function () {
    return FlowRouter.getParam('productAddress')
  },
  ipfsInfoConfig: function () {
    const product = thisProduct()
    return {
      getDataMethod: product.IPFSData,
      setDataMethod: product.setIPFSData,
      formTemplate: 'productInfoForm',
      formTitle: 'Update Poduct Information',
      updateable: true,
      owner: product.seller.call()
    }
  }
})

Template.product.events({
  'click .back': function () {
    FlowRouter.go('market', {address: FlowRouter.getParam('marketAddress')})
  }
})
```

## 9. Product Listings

Now we need to list the items in a market. We can do this by simply calling the market contract whenever we land on the market template.

`client/templates/views/market.js`

```javascript
Template.market.helpers({
  // ...
  marketAddress: function () {
    return FlowRouter.getParam('address')
  },
  products: function () {
    const market = thisMarket()
    const marketCount = market.count().toNumber()
    let products = []
    for (let i = 0; i < marketCount; i++) {
      const product = Purchase.at(market.items(i))
      products.push({address: product.address, getDataMethod: product.IPFSData})
    }
    return products
  }
})
```

To get the product listings and metadata, we simply iterate from 0 up until the current `market.count`, getting the `product.address` and `product.IPFSData` for each item, which gets passed into `ipfsInfo`: 

`client/templates/views/market.html`

```handlebars
<ul class="collection">
  {{#each products}}
    <li class="collection-item avatar">
      {{#ipfsInfo config=.}}
        <img src="{{image}}" alt="" class="circle">
        <div class="title">
          <a href="/market/{{marketAddress}}/{{../address}}" class="href">
            {{title}}
            <br>
            <small>{{../address}}</small>
          </a>
        </div>
        {{#markdown}}{{description}}{{/markdown}}
        <div class="secondary-content"><i class="material-icons">{{icon}}</i></div>
      {{/ipfsInfo}}
    </li>
  {{else}}
    <p class='flow-text center-align'>No products listed</p>
  {{/each}}
</ul>
```

What's great here is that we can re-use our `ipfsInfo` block helper to render the IPFS data of the products as we iterate over them. As long as we don't pass `updateable` in config, the 'edit metadata' button will never show up.

Now this is hooked up, can now deploy markets and products and edit the metadata for both.

## 10. Accounts Switching

We're almost ready to start buying and selling, but first let's create a way for the user to switch accounts. It's possible to have more than one account in `geth`, so instead of just defaulting to coinbase, let's make use of the `ethereum:accounts` package to allow users to switch which account is being used by our dapp: 

```
meteor add ethereum:accounts
```

We'll need to initialize EthAccounts

`client/lib/init.js`
```
Meteor.startup(function () {
  EthAccounts.init()
})
```

`EthAccounts` will maintain a local minimongo collection, which lets us keep track of our accounts using the familiar Meteor way. We'll use this to create a dropdown of accounts and create our own accounts switching controller.

`client/chelpers/defaultAccount.js`

```javascript
app.setDefaultAccount = function (address) {
  // ensure it exists
  if (EthAccounts.findOne({address: address})) {
    // check if the current default exists and unset it
    const thisDefault = EthAccounts.findOne({default: true})
    if (thisDefault) {
      EthAccounts.update(thisDefault._id, {$unset: {default: true}})
    }
    // update the given address
    EthAccounts.update({address}, {$set: {default: true}})
    // set web3 defualt adddres
    web3.eth.defaultAccount = address
  }
}

app.getDefaultAccount = function () {
  return EthAccounts.findOne({default: true})
}

app.getDefaultAddress = function () {
  const account = app.getDefaultAccount()
  if (account) {
    return account.address
  }
}

UI.registerHelper('defaultAddress', app.getDefaultAddress)

// set the default account to coinbase if it's not set
Meteor.startup(function () {
  const address = app.getDefaultAddress()
  if (!address) {
    app.setDefaultAccount(web3.eth.coinbase)
  } else {
    web3.eth.defaultAccount = address
  }
})
```

And let's add the dropdown UI:

`client/templats/components/navbar.html`

```
<template name="navbar">
  <ul id="accounts-dropdown" class="dropdown-content">
    {{#each accounts}}
      {{#if @index}}
        <li class="divider"></li>
      {{/if}}
      <li>
        <a class='select-account' href="#!">
          <span class='valign-wrapper'>
            {{shortAddress address}}
          </span>
        </a>
      </li>
    {{/each}}
  </ul>
  <nav class="light-blue lighten-1" role="navigation">
    <div class="nav-wrapper">
      <a href="/" class="brand-logo center">EthMart</a>
      <ul class="right">
        <li>
          <a class="dropdown-button valign-wrapper" href="#!" data-activates="accounts-dropdown">
            {{shortAddress defaultAddress}} - {{balance}} ETH
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
```

`client/templates/components/navbar.js`

```
Template.navbar.onRendered(function () {
  this.$('.dropdown-button').dropdown({
    constrain_width: false,
    belowOrigin: true
  })
})

Template.navbar.helpers({
  accounts: function () {
    return EthAccounts.find()
  },
  balance: function () {
    return web3.fromWei(web3.eth.getBalance(app.getDefaultAddress()).toNumber(), 'ether')
  }
})

Template.navbar.events({
  'click .select-account': function (e) {
    e.preventDefault()
    app.setDefaultAccount(this.address)
  }
})
```

`client/helpers/shortAddress.js`
```javascript
app.shortAddress = function (address, count) {
  if (typeof count !== 'number') {
    count = 0
  }
  count = count || 6
  if (address.startsWith('0x')) {
    address = address.substr(2)
  }
  return `${address.substr(0, count)}...${address.substr(-count)}`
}

UI.registerHelper('shortAddress', app.shortAddress)
```

Now we need to update the `ipfsInfo` logic to determine who to show the 'edit metadata' button to:

`client/templates/components/ipfsInfo.js`
```
Template.ipfsInfo.helpers({
  isUpdatable: function () {
    return this.config.updateable && app.getDefaultAddress() === this.config.owner
  }
})
```

To test this out, create a new account in your attached `geth` console:

```
personal.newAccount()
```

Now, in the app, we should have the ability to change accounts using the dropdown menu.

## 11. The Buy Button

The final piece in the puzzle is the escrow contract. It's what makes the market possible. We have already deployed it, but now it's time to take a closer look at it's methods and what it actually does.

We're using modified code that was (originally created here)[https://github.com/frozeman/example-escrow-dapp/blob/master/client/buyButton.js] to manage this.

`client/templates/components/buyButton.html`

```handlebars
<template name="buyButton">
  <div class="btn btn-block {{getState 'class'}}">
    {{#if TemplateVar.get "processing"}}
        Processing...
    {{else}}
        {{getState 'buttonText'}}
    {{/if}}
  </div>
  {{#if getState 'subText'}}
    <small>
        {{getState 'subText'}}
    </small>
  {{/if}}
</template>
```

`client/templates/components/buyButton.js`

```javascript
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
```

TODO explain this

The final thing to do is add this `buyButton` component to our product page.

`client/templates/views/product.html`

```handlebars
{{> buyButton contract=contract}}
```

`client/templates/views/product.js`

```javascript
Template.product.helpers({
  contract: thisProduct,
  //...
})
```

And we're done.

# Future Features To Implement

* Price Ticker
* IPFS Image Upload
* White-listed Marketplace
* Manage multiple orders with the same Purchase contract
* EIP20 Support
* Identicon
* Bitcoin Payments (shapeshift)