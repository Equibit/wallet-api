# The `blockchain-info` service

This service should monitor blockchain information for all blockchain types the system is connected to. Currently the blockchains are:
- Bitcoin
- Equibit

Information should be stored in DB.

The following data should be recorded per blockchain:
- Connection status, blockchain mode.
- Current block height.
- Latest block transactions with its block height `{<block-height>: [<TXID>]}`.
  - If the service was restarted and more than one block has been mined then it should record all new transaction IDs. This is necessary for updating Transaction records with block info to track confirmations.
  - There should be a hook to update Transaction records.

Example:
```
GET /blockchain-info
RESPONSE:
[{
  "_id": ObjectID(0),
  "type": "BTC",
  "mode": "regtest",
  "status": "ok",
  "currentBlockHeight": 123
}, {
  "_id": ObjectID(1),
  "type": "EQB",
  "mode": "test",
  "status": "ok",
  "currentBlockHeight": 456
}]
```

Doubts:
- Should `txids` be stored in a separate collection or just being skipped from the response?
```
{
  "type": "BTC",
  "mode": "regtest",
  "status": "ok",
  "currentBlockHeight": 123
  "txids": {
    "123": ["abc123", "zxc456"]
  }
}
```
VS blockchain-latest-transactions
```
{
  "_id": ObjectID(0),
  "blockchainId": ObjectID(0),
  "txid": "abc123"
}
```

## Alternative tracking transaction block

Instead of updating transaction records with block height when it gets mined, we can query /
