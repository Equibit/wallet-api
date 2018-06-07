
function timeout (promise, millis, message) {
  return Promise.race([
    new Promise((resolve, reject) => {
      setTimeout(
        reject,
        millis,
        message || 'timed out'
      )
    }),
    promise
  ])
}

module.exports = { timeout }
