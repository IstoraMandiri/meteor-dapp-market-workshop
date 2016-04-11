# Set up Guide

This document will outline the steps that need to be taken to prepare.  We're going to install the following items:

* Geth
* Mist
* IPFS
* Meteor
* Meteor-build-client

This walk-through will cater for both Mac OSX and Ubuntu 14.04.

Windows users: please use a virtual machine for the sake of this workshop. There's no reason you can't run all the following natively on Windows, but there may be edge cases cases, and documentation isn't as good for Windows.

## Geth

Geth is one of the many clients available for Ethereum. It is the most supported and widely documented client, which is why we're going to be using it.

It's really simple to install `geth` - just run the following and install via your package manager.

```
// on ubuntu
sudo apt-get install software-properties-common
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo add-apt-repository -y ppa:ethereum/ethereum-dev
sudo apt-get update
sudo apt-get install ethereum

// on osx
// if you don't already have homebrew, install it:
// /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
// ... then install ethereum with homebrew
brew tap ethereum/ethereum
brew install ethereum
```

Once that's done - try testing it.

```
geth --fast
```

This will start up `geth` and connect to the ethereum mainnet. The `--fast` option will 'fast sync', which only downloads block headers and is therefore much faster. Syncing up with the mainnet is likely to take several hours if you have a fast internet connection (as of April 2016).

Now check that you have the solidity compiler. In a new terminal window use `geth attach`, to attach to your local node.

Then use:

```
eth.getCompilers()
```

You should see it return something like `['Solidity']`.

If it does not, you'll need to install solidity. First kill `geth` and the attached console. Then:

```
// ubuntu
sudo add-apt-repository ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install solc
which solc

// osx
brew install cpp-ethereum
brew linkapps cpp-ethereum
which solc
```

## Mist

Confusingly, Mist is two things:

* An Ethereum Wallet (latest public release)
* A Dapp Browser (developers only now, to be publicly released with Metropolis)

We should get both of these versions; one for making it easer to transfer Eth around, and one for seeing what our dapp might look like to a typical user in the future.

For the publicly released version, download the latest binary from https://github.com/ethereum/mist/releases.

To clone the development version, simply `git clone https://github.com/ethereum/mist`. We'll do the rest later.

## Meteor

Meteor is the world's best web app development platform. It's very popular in the Ethereum community which has several advantages we'll explain later.

For now, just install Meteor:

```
// osx and ubuntu
curl https://install.meteor.com/ | sh
```

## Meteor-Build-Client

`meteor-build-client` will enable us to package our Meteor app into client-only files. More on this later.

In order to install it, we'll need nodejs. I'd recommend using [`nvm`](https://github.com/creationix/nvm) (node version manager).

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
```

Once you have node installed, you should be able to install `meteor-build-client` globally:

```
npm install -g meteor-build-client
```

## IPFS

IPFS, the **I**nter**P**lenetary **F**ile**S**ystem, will act as our decentralised hosting server. It can be used to very easily store data in decentralised way. We can use it for storing both the data in our dapp and our dapp code in a censorship-resistant way.

Follow the instructions at https://ipfs.io/docs/install/

To check things are working, start up the IPFS service.

```
ipfs daemon
```

And then visit http://localhost:5001/webui
