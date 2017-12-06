const defaults = {
  From: undefined,
  TemplateId: undefined,
  emailAddressFromUserRecord: false,
  templateCodeField: 'emailVerificationCode',
  dataCodeField: 'emailVerificationCodePlain'
}

module.exports = function (options = {}) {
  options = Object.assign({}, defaults, options)

  return hook => {
    const postmarkMessages = hook.app.service('postmark-messages')
    const fromAddress = hook.data.From || options.From

    if (!fromAddress) {
      throw new Error('A `From` address must be configured for the email verification email hook. Or pass the email in the `hook.data`.')
    }
    if (!options.TemplateId) {
      throw new Error('A `TemplateId` must be configured for the email verification email hook.')
    }

    const message = {
      From: fromAddress,
      To: options.emailAddressFromUserRecord ? hook.user.email : hook.data.email,
      TemplateId: options.TemplateId,
      TemplateModel: {
        [options.templateCodeField]: hook.data[options.dataCodeField]
      }
    }
    return postmarkMessages.create(message).then(message => {
      return hook
    })
  }
}
