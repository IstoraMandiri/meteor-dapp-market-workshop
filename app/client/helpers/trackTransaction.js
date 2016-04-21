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
