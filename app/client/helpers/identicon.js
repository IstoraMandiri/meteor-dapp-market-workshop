// in-memory cache for generated icon data
let cachedIdenticons = {}

UI.registerHelper('identicon', function (address) {
  const identity = `${address}`.toLowerCase()

  // check the cache
  if (!cachedIdenticons[identity]) {
    cachedIdenticons[identity] = blockies.create({
      seed: identity,
      size: 8,
      scale: 8
    }).toDataURL()
  }

  return cachedIdenticons[identity]
})
