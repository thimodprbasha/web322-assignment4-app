const bcrypt = require("bcrypt");

module.exports.cryptPassword = function (round, password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(round, (error, salt) => {
      if (error) reject(error);
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) reject(error);
        resolve(hash);
      });
    });
  });
};

module.exports.dycrptPassword = function (password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  });
};
