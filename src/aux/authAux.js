const jwt = require('jsonwebtoken');
const jwtKey = require('../config/vars').jwtKey;

const createUserToken = (user) => {
  const payload = {
    check: true,
    user
  }

  const token = jwt.sign(payload, jwtKey, {
    expiresIn: "3d"
  });

  return {
    token,
    tokenExp: getTokenExpiration()
  }
}

const getTokenExpiration = () => {
  const daysToExpire = 3;
  const expiration = 1000 * 60 * 60 * 24 * daysToExpire; // three days in ms

  const tokenExpiration = new Date().getTime() + expiration;

  return tokenExpiration;
}

module.exports = {
  getTokenExpiration,
  createUserToken
}