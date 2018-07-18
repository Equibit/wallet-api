const assert = require('assert')
const app = require('../../../app')
const testHook = require('./hook.password.past-policy')
const userUtils = require('../../../../test-utils/users')
const crypto = require('crypto')

describe('Hook : Users : Enforce Past Password Policy', function (done) {
  beforeEach(function (done) {
<<<<<<< HEAD
    userUtils.create(app)
    .then(user => {
=======
    userUtils.create(app).then(user => {
>>>>>>> parent of 04fa28f... Added referral-codes service. Updated test files to remove test referral entries into collections.
      this.user = user
      done()
    })
  })

  afterEach(function (done) {
<<<<<<< HEAD
    userUtils.removeAll(app)
    .then(() => done())
=======
    userUtils.removeAll(app).then(() => done())
>>>>>>> parent of 04fa28f... Added referral-codes service. Updated test files to remove test referral entries into collections.
  })

  it(`throws an error if !hook.data.password`, function (done) {
    const user = this.user
    const key = 'pastPasswordHashes'
    delete user[key]

    const context = {
      app,
      user,
      params: { user }
    }
    const enforcePastPasswordPolicy = testHook({ attr: key })

    enforcePastPasswordPolicy(context)
      .catch(error => {
        assert(error.message === 'No password was provided in the request', `the correct error was returned`)
        done()
      })
  })

  it(`creates the attr if it doesn't already exist`, function (done) {
    const user = this.user
    const key = 'pastPasswordHashes'
    delete user[key]

    const context = {
      app,
      data: { password: 'test' },
      user,
      params: { user }
    }
    const enforcePastPasswordPolicy = testHook({
      oldPasswordsAttr: key // The user field that will hold hashes of old passwords
    })

    enforcePastPasswordPolicy(context)
      .then(context => {
        assert(Array.isArray(user[key]))
        done()
      })
      .catch(error => {
        assert(!error, error.message)
        done()
      })
  })

  it(`adds the pastPasswordHashes to the hook.data and hook.params.user`, function (done) {
    const user = this.user
    const passwordHash = crypto.createHash('sha256').update('test').digest('hex')
    const context = {
      app,
      data: { password: 'test' },
      user,
      params: { user }
    }
    const enforcePastPasswordPolicy = testHook({
      oldPasswordsAttr: 'pastPasswordHashes' // The user field that will hold hashes of old passwords
    })
    const expected = [passwordHash]

    enforcePastPasswordPolicy(context)
      .then(context => {
        assert.deepEqual(user.pastPasswordHashes, expected, `the user's pastPasswordHashes matched`)
        assert.deepEqual(context.data.pastPasswordHashes, expected, `the hook.data.pastPasswordHashes matched`)
        done()
      })
      .catch(error => {
        assert(!error, error.message)
        done()
      })
  })

  it(`appends the pastPasswordHashes to the hook.data and hook.params.user`, function (done) {
    const user = this.user
    const password = 'test'
    const otherPassword = 'test2'
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    const existingPasswordHash = crypto.createHash('sha256').update(otherPassword).digest('hex')

    user.pastPasswordHashes = [existingPasswordHash]

    const context = {
      app,
      data: { password: 'test' },
      user,
      params: { user }
    }
    const enforcePastPasswordPolicy = testHook({
      oldPasswordsAttr: 'pastPasswordHashes' // The user field that will hold hashes of old passwords
    })
    const expected = [existingPasswordHash, passwordHash]

    enforcePastPasswordPolicy(context)
      .then(context => {
        assert.deepEqual(user.pastPasswordHashes, expected, `the user's pastPasswordHashes matched`)
        assert.deepEqual(context.data.pastPasswordHashes, expected, `the hook.data.pastPasswordHashes matched`)
        done()
      })
      .catch(error => {
        assert(!error, error.message)
        done()
      })
  })

  it(`rejects previously-used passwords`, function (done) {
    const user = this.user
    const context = {
      app,
      data: { password: 'test' },
      user,
      params: { user }
    }
    const enforcePastPasswordPolicy = testHook({
      passwordCount: 5
    })

    enforcePastPasswordPolicy(context)
      .then(context => enforcePastPasswordPolicy(context))
      .then(context => {
        assert(!context, 'it should not have allowed the same password to be stored twice')
        done()
      })
      .catch(error => {
        assert(error.message === 'You may not use the same password as one of the last 5 passwords.', error.message)
        done()
      })
  })

  it(`only stores up to the passwordCount`, function (done) {
    const user = this.user
    const context = {
      app,
      data: { password: 'test1' },
      user,
      params: { user }
    }
    const enforcePastPasswordPolicy = testHook({
      passwordCount: 5
    })

    enforcePastPasswordPolicy(context)
      .then(context => {
        context.data.password = 'test2'
        return enforcePastPasswordPolicy(context)
      })
      .then(context => {
        context.data.password = 'test3'
        return enforcePastPasswordPolicy(context)
      })
      .then(context => {
        context.data.password = 'test4'
        return enforcePastPasswordPolicy(context)
      })
      .then(context => {
        context.data.password = 'test5'
        return enforcePastPasswordPolicy(context)
      })
      .then(context => {
        context.data.password = 'test6'
        return enforcePastPasswordPolicy(context)
      })
      .then(context => {
        assert(user.pastPasswordHashes.length === 5, `there were 5 previous hashedPasswords`)
        assert(context.data.pastPasswordHashes.length === 5, `there were 5 previous hashedPasswords`)
        done()
      })
      .catch(error => {
        assert(!error, error.message)
        done()
      })
  })

  it(`removes old passwords when a new one is added`, function (done) {
    const user = this.user
    const password1 = crypto.createHash('sha256').update('password1').digest('hex')
    const password2 = crypto.createHash('sha256').update('password2').digest('hex')
    const password3Plain = 'password3'
    const password3 = crypto.createHash('sha256').update(password3Plain).digest('hex')

    user.pastPasswordHashes = [password1, password2]

    const context = {
      app,
      data: { password: password3Plain },
      user,
      params: { user }
    }
    const enforcePastPasswordPolicy = testHook({
      passwordCount: 2
    })
    const expected = [password2, password3]

    enforcePastPasswordPolicy(context)
      .then(context => {
        assert.deepEqual(user.pastPasswordHashes, expected, `only password2 and password3 remain`)
        assert.deepEqual(context.data.pastPasswordHashes, expected, `only password2 and password3 remain`)
        done()
      })
      .catch(error => {
        assert(!error, error.message)
        done()
      })
  })
})
