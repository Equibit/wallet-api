const assert = require('assert')
const app = require('../../src/app')
const testHook = require('../../src/hooks/failed-logins.verify')
const userUtils = require('../../test-utils/users')

describe('Hook: Failed Logins', function (done) {
  beforeEach(function (done) {
    userUtils.create(app).then(user => {
      this.user = user
      done()
    })
  })

  afterEach(function (done) {
    userUtils.removeAll(app).then(() => done())
  })

  it(`sets the notifyFailedLogins flag after 3 attempts, by default`, function (done) {
    const verifyFailedLogins = testHook()
    const user = this.user
    const context = {
      app,
      params: { user }
    }

    // First run
    verifyFailedLogins(context)
      .then(context => {
        assert(user.failedLogins.length === 1, `there was one failed login`)

        const failedLogin = user.failedLogins[0]
        assert(failedLogin.date, `the failed login included a date`)
        assert(failedLogin.sendEmail === false, `the failed login's sendEmail property was false`)
        assert(context.notifyFailedLogins === undefined, `the flag wasn't set after a single failed login`)

        // Second run
        return verifyFailedLogins(context)
      })
      .then(context => {
        assert(user.failedLogins.length === 2, `there were two failed logins`)

        const failedLogin = user.failedLogins[1]
        assert(failedLogin.date, `the failed login included a date`)
        assert(failedLogin.sendEmail === false, `the failed login's sendEmail property was false`)
        assert(context.notifyFailedLogins === undefined, `the flag wasn't set after a second failed login`)

        // Third run
        return verifyFailedLogins(context)
      })
      .then(context => {
        assert(user.failedLogins.length === 3, `there were three failed logins`)

        const failedLogin = user.failedLogins[2]
        assert(failedLogin.date, `the failed login included a date`)
        assert(failedLogin.sendEmail === true, `the third failed login had the sendEmail prop set to true`)
        assert(context.params.notifyFailedLogins === true, `the flag was set after the third failed login`)

        // Fourth run
        return verifyFailedLogins(context)
      })
      .then(context => {
        assert(user.failedLogins.length === 3, `there were still three failed logins`)
        assert(user.failedLogins[2].sendEmail === true)
        assert(context.params.notifyFailedLogins === undefined, `the flag was not set after the fourth failed login`)

        done()
      })
  })

  it(`clears the failedLogins after the timeBetweenEmails has passed`, function (done) {
    const verifyFailedLogins = testHook({
      failureCount: 3,
      timeBetweenEmails: 100 // shorten the time for testing
    })
    const user = this.user
    const context = {
      app,
      params: { user }
    }

    // First run
    verifyFailedLogins(context)
      .then(context => verifyFailedLogins(context))
      .then(context => verifyFailedLogins(context))
      .then(context => verifyFailedLogins(context))
      .then(context => {
        return new Promise(resolve => {
          setTimeout(function () {
            assert(user.failedLogins.length === 3, `there were three failed logins`)
            resolve(context)
          }, 105)
        })
      })
      .then(context => verifyFailedLogins(context))
      .then(context => {
        assert(user.failedLogins.length === 1, `there was one failed login`)
        assert(user.failedLogins[0].sendEmail === false, `the failed login was not flagged to send the email`)
        assert(context.params.notifyFailedLogins === undefined, `the flag was not set`)
        done()
      })
  })

  it(`allows adjusting the failureCount`, function (done) {
    const verifyFailedLogins = testHook({
      failureCount: 5
    })
    const user = this.user
    const context = {
      app,
      params: { user }
    }

    // First run
    verifyFailedLogins(context)
      .then(context => verifyFailedLogins(context))
      .then(context => verifyFailedLogins(context))
      .then(context => verifyFailedLogins(context))
      .then(context => verifyFailedLogins(context))
      .then(context => {
        assert(user.failedLogins.length === 5, `there were five failed logins`)
        assert(user.failedLogins[4].sendEmail === true, `the fifth failed login was flagged to send the email`)
        assert(context.params.notifyFailedLogins === true, `the flag was set`)
        done()
      })
  })
})
