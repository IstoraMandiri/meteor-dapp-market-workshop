contract Market {

  // public properties, available to be called
  address public owner;
  mapping(uint => address) public items;
  uint public count;
  string public ipfsData;

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
  function setData(string ipfsHash)
    onlyOnwer
  {
    ipfsData = ipfsHash;
  }

}
