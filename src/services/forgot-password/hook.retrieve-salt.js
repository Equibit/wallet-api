// Copy salt from params.user to data.
module.exports = function () {
  return hook => {
    return new Promise(resolve => {
      hook.data.salt = hook.params.user.salt;
      resolve(hook);
    });
  };
};
