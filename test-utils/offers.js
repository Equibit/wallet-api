module.exports = {
  createOrder (app, options = {}) {
    const createOrderSkel = {
      'userId': '000000000000000000000000',
      issuanceId: '000000000000000000000000',
      'issuanceAddress': '000000000000000000000000',
      'type': 'SELL',
      'portfolioId': '000000000000000000000000',
      'quantity': 60,
      'price': 10,
      'status': 'OPEN',
      'isFillOrKill': false,
      'goodFor': 7,
      'companyName': 'Foo',
      'issuanceName': 'Bar',
      'issuanceType': 'bonds',
      btcAddress: '000000000000000000000000',
      eqbAddress: '000000000000000000000000'
    }
    return app.service('orders').create(Object.assign(createOrderSkel, options))
  },

  createOffer (app, options = {}) {
    const createDataSkel = {
      userId: '000000000000000000000000',
      orderId: '000000000000000000000000',
      type: 'SELL',
      status: 'OPEN',
      htlcStep: 1,
      quantity: 10,
      price: 333,
      issuanceId: '000000000000000000000000',
      issuanceAddress: '000000000000000000000000',
      hashlock: '000000000000000000000000',
      timelock: 1234,
      btcAddress: '000000000000000000000000',
      eqbAddress: '000000000000000000000000'
    }
    return app.service('offers').create(Object.assign(createDataSkel, options))
  }
}
