const postmark = require('feathers-postmark')
const { disallow } = require('feathers-hooks-common')

module.exports = function () {
  const app = this
  const options = app.get('postmark')

  app.use('postmark-messages', postmark(options))

  const postmarkService = app.service('postmark-messages')

  postmarkService.hooks({
    before: {
      create: [
        disallow('external'),
        hook => {
          // Do not send emails if testing:
          if (process.env.TESTING === 'true') {
            hook.result = {}
            return hook
          }
          return hook
        }
      ]
    },
    after: {
      create: []
    },
    error: {
      create: [
        hook => {
          // debugger;
        }
      ]
    }
  })
}
