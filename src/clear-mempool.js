/* Script to avoid too-long-mempool-chain error by mining a block.
 * Additionally maintains balance on addresses from where we send coins to test users.
 * */

const path = require('path')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const axios = require('axios')

// Configure the addresses to which you want to send the btc/eqb reward to
// Max mempool size for eqb node is 25 - set limit to 20 for wiggle room
// Max mempool size for btc is much larger

const app = feathers().configure(configuration(path.join(__dirname, '..')))
const config = app.get('mempool')

// BTC
axios.get('http://localhost:3030/proxycore?node=btc&method=getrawmempool')
  .then(pool => {
    console.log('BTC mempool length: ', JSON.stringify(pool.data.result.length))
    if (pool.data.result.length >= config.limit * 10) {
      console.log('Mining...')
      axios.get(`http://localhost:3030/proxycore?node=btc&method=generatetoaddress&params[]=1&params[]=${config.btcAddress}`)
        .then(res => {
          console.log('BTC result: ', JSON.stringify(res.data))
        })
    }
  })
  .catch(error => {
    console.log('There was an error with the get: ', error.message)
  })

// EQB
axios.get('http://localhost:3030/proxycore?node=eqb&method=getrawmempool')
  .then(pool => {
    console.log('EQB mempool length: ', JSON.stringify(pool.data.result.length))
    if (pool.data.result.length >= config.limit) {
      console.log('Mining...')
      axios.get(`http://localhost:3030/proxycore?node=eqb&method=generatetoaddress&params[]=1&params[]=${config.eqbAddress}`)
        .then(res => {
          console.log('EQB result: ', JSON.stringify(res.data))
        })
    }
  })
  .catch(error => {
    console.log('There was an error with the get: ', error.message)
  })
