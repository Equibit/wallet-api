module.exports = function formatParams (params) {
  return params && params.map(p => isNaN(Number(p)) ? ((p === 'true' || p === 'false') ? (p === 'true') : p) : Number(p))
}
