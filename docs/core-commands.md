**Issuer RPC commands**
- "getnewissuer"
- "getissuers"
- "authorizeequibit"
- "blankequibit"

**Messaging RPR commands**
- "p2pmessage"
- "multicastmessage"
- "broadcastmessage"
- "getmessage"
- "getmessages"
- "deletemessage"
- "deletemessages"

**Polling RPC commands**
- "poll"
- "vote"
- "pollresults"

**Proxy RPC commands**
- "assigngeneralproxy"
- "revokegeneralproxy"
- "assignissuerproxy"
- "revokeissuerproxy"
- "assignpollproxy"
- "revokepollproxy"

**WoT (Web of Trust) RPC commands**
- "requestwotcertificate"
- "getwotcertificate"
- "deletewotcertificate"
- "revokewotcertificate"
- "wotchainexits"

**Other wallet commands**
- "dumpwalletdb"
- "trustedsend"

---

*Issuers* are stored in wallet database.

*Messages* are stored in wallet database as well.

*WoT* are stored in wallet database as well but can be broadcasted to the network or can be sent to an address of a signer.

*Proxies* are stored in wallet database as well and are relayed via a user message to every node.

*Polls (and votes)* are stored in wallet database as well and are relayed via a user message to every node
"trustedsend" RPC command creates an Equibit specific transaction.
