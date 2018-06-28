// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return function addEnvSettings (hook) {
    // Hooks can either return nothing or a promise
    // that resolves with the `hook` object for asynchronous operations
    const result = hook.result.data || [hook.result]
    // console.log(`hook.addEnvSettings: `, result)
    if (result && result.length) {
      result.forEach(nodeInfo => {
        if (nodeInfo.coinType === 'EQB') {
          nodeInfo.sha = hook.app.get('equibitCore').sha || 'SHA256'
        }
      })
    }
    return Promise.resolve(hook)
  }
}
