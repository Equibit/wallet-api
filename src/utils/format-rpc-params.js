const formatParam = function formatParam (param) {
  const paramIsArray = Array.isArray(param)
  const paramIsTrue = param === 'true' || param === true
  const paramIsFalse = param === 'false' || param === false
  const paramIsBool = paramIsTrue || paramIsFalse
  const paramAsNum = Number(param)
  const paramIsNaN = isNaN(paramAsNum)
  const paramIsObject = typeof param === 'object'
  var formatted = null

  if (paramIsNaN || paramIsBool) {
    if (paramIsBool) {
      formatted = paramIsTrue // boolean true or false
    } else if (paramIsArray) {
      formatted = formatParams(param)
    } else if (paramIsObject) {
      Object.keys(param).map(objKey => {
        param[objKey] = formatParam(param[objKey])
      })
      // use the param object with all its properties also formatted
      formatted = param
    } else { // else it is a string
      formatted = param
    }
  } else { // else it is a number
    formatted = paramAsNum
  }

  return formatted
}

const formatParams = function formatParams (params) {
  return params && params.map(formatParam)
}

module.exports = formatParams
