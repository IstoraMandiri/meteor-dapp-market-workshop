# Geth + Accounts Basics

Let's start `geth` on a local testnet:

```
geth --dev --rpc --rpccorsdomain "*"
```

And attach the console (in a new terminal)

```
geth attach
```

Now let's see what accounts we have:

```
eth.accounts
```

Don't have any? Don't worry. We can create a new one!

```
personal.newAccount()
// use the password `testing` for now
eth.accounts
// list accounts
```

The first account you create will also be set as the coinbase.

Let's see how much ether we have.

```
eth.getBalance(eth.accounts[0])
```

Nada.

In order to generate tEther we can mine:

```
miner.start()
// or use miner.start(1) for on CPU core
// wait a few seconds
miner.stop()
```

And let's see again

```
myBalance = eth.getBalance(eth.accounts[0])
// amount in wei
```

That's a lot of ether... http://ether.fund/tool/converter
 
```
web3.fromWei(myBalance, 'ether')
```

That's more like it.

Let's create a second account.


```
personal.newAccount()
// use the same password `testing`
```

And check the balance:

```
eth.getBalance(eth.accounts[1])
```

Now let's send some over:

```
eth.sendTransaction({from:eth.accounts[0], to: eth.accounts[1], value: 2000000})
```

You'll be prompted with a password. 

But we're not mining, so the transaction can't happen...

```
miner.start()
// wait a few
```

After the tx is mined:

```
miner.stop()
eth.getBalance(eth.accounts[1])
// yay
```

Let's say you don't want to enter the password every time?

```
personal.unlockAccount(eth.accounts[0])
```

Now let's see some solidity...

http://solidity.readthedocs.org/en/latest/structure-of-a-contract.html

---

**DANGER: NEVER DO THIS IF YOU HAVE REAL ETHER** 

To reset this demo, use `rm -rf ~/Library/Etheruem/keystore`