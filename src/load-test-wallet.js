/* Script to load test wallets running e2e tests */

const path = require('path')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const axios = require('axios')

const app = feathers().configure(configuration(path.join(__dirname, '..')))
const configBTC = app.get('bitcoinCore')
const configEQB = app.get('equibitCore')
const configMempool = app.get('mempool')

const transferAmount = 0.0003

// BTC
axios({
    method: 'POST',
    url: configBTC.url,
    data: {
        jsonrpc: '1.0',
        method: 'sendtoaddress',
        params: [configMempool.btcAddress, transferAmount]
    },
    auth: {
        username: configBTC.username,
        password: configBTC.password
    }
})

// EQB
axios({
    method: 'POST',
    url: configEQB.url,
    data: {
        jsonrpc: '1.0',
        method: 'sendtoaddress',
        params: [configMempool.eqbAddress, transferAmount]
    },
    auth: {
        username: configEQB.username,
        password: configEQB.password
    }
})