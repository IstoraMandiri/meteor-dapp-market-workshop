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
