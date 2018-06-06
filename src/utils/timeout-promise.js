
function timeout (promise, millis, message) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(
        reject,
        millis,
        message || 'timed out'
      )
    })
  ])
}

module.exports = { timeout }
