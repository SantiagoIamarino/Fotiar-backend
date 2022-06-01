const User = require('../models/user')

const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
      User.findById(userId, (err, userDB) => {
          if(err || !userDB) {
              reject()
          }
  
          resolve(userDB);
      })
  })
}

// This function verifies if the email is already taken
const checkEmail = (newEmail, lastEmail)  => {
  console.log('checking')
  return new Promise((resolve, reject) => {

      // Checking if new email is different than last email
      if(!newEmail || newEmail === lastEmail) {
        resolve(lastEmail);  
      } 

      User.findOne({email: newEmail}, (errFind, userFound) => {

        if(userFound) {
            reject({
                ok: false,
                message: 'El email indicado ya se encuentra en uso'
            });
        }

        resolve(newEmail);

      })

  })
}


module.exports = {
  checkEmail,
  getUserById
}