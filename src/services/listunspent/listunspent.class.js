const axios = require('axios')

// http://localhost:3030/proxycore?method=listunspent&params[0]=0&params[1]=99999&params[2][]=mp9GiieHrLQvLu4C8nE9bbwxNmXqcC3nVf&params[2][]=mwd7FgMkm9yfPmNTnntsRbugZS7BEZaf32

class Service {
  constructor (options) {
    this.options = options || {}
  }

  // Given a list of addresses return amounts by address and a summary.
  find (params) {
    console.log('listunspent.find params.query: ', params.query)
    const addresses = params.query.addr instanceof Array ? params.query.addr : [params.query.addr]
    return axios({
      method: 'POST',
      // url: 'http://99.227.230.43:8331',
      url: 'http://localhost:18332',
      data: {
        jsonrpc: '1.0',
        method: 'listunspent',
        params: [0, 99999, addresses]
      },
      auth: {
        username: 'equibit',
        password: 'equibit'
      }
    })
    .then(res => {
      return res.data.result.reduce((acc, txout) => {
        acc.summary.total += txout.amount
        if (!acc[txout.address]) {
          acc[txout.address] = {
            amount: 0,
            txouts: []
          }
        }
        acc[txout.address].amount += txout.amount
        acc[txout.address].txouts.push(txout)
        return acc
      }, {summary: {total: 0}})
    })
    .catch(err => {
      console.log('_______ PROXY ERROR: ', err.response.data)
      return err.response.data
    })
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current)))
    }

    return Promise.resolve(data)
  }

  update (id, data, params) {
    return Promise.resolve(data)
  }

  patch (id, data, params) {
    return Promise.resolve(data)
  }

  remove (id, params) {
    return Promise.resolve({ id })
  }
}

// function formatParams (params) {
//   return params && params.map(p => isNaN(Number(p)) ? ((p === 'true' || p === 'false') ? (p === 'true') : p) : Number(p))
// }

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
