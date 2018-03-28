# The `blockchain-info` service

This service should monitor blockchain information for all blockchain types the system is connected to. Currently the blockchains are:
- Bitcoin
- Equibit

Information should be stored in DB.

The following data should be recorded per blockchain:
- Connection status, blockchain mode.
- Current block height.

Example:
```
GET /blockchain-info
RESPONSE:
[{
  "_id": ObjectID(0),
  "coinType": "BTC",
  "mode": "regtest",
  "currentBlockHeight": 123
  "status": 1,
  "errorMessage": ""
}, {
  "_id": ObjectID(1),
  "coinType": "EQB",
  "mode": "test",
  "currentBlockHeight": 456
  "status": 0,
  "errorMessage": "connect ENETUNREACH 169.55.144.154:18331 - Local (0.0.0.0:58209)"
}]
```
