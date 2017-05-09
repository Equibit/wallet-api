const defaults = {
  From: undefined,
  TemplateId: undefined,
  tempPasswordField: undefined
}

module.exports = function (options = {}) {
  options = Object.assign({}, defaults, options)

  return hook => {
    const postmarkMessages = hook.app.service('postmark-messages')
    const fromAddress = hook.data.From || options.From

    if (!fromAddress) {
      throw new Error('A `From` address must be configured for the welcome email hook. Or pass the email in the `hook.data`.')
    }
    if (!options.TemplateId) {
      throw new Error('A `TemplateId` must be configured for the welcome email hook.')
    }
    if (!hook.data[options.tempPasswordField]) {
      throw new Error(`A \`${options.tempPasswordField}\` was not found on the \`hook.data\` for the welcome email hook.`)
    }

    const message = {
      From: fromAddress,
      To: hook.data.email,
      TemplateId: options.TemplateId,
      TemplateModel: {
        tempPassword: hook.data[options.tempPasswordField]
      }
    }
    return postmarkMessages.create(message).then(message => {
      return hook
    })
  }
}
