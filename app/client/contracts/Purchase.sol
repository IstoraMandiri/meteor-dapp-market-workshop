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
