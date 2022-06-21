const Cart = require('../models/cart')

function cleanUserCart(user) {
  return new Promise((resolve, reject) => {
      Cart.findOne({userId: user._id}, (err, cartDB) => {
          if(err || !cartDB) {
              resolve('Cart not updated');
          }

          cartDB.products = [];

          cartDB.update(cartDB, (errUpdt, cartUpdated) => {
              if(errUpdt) {
                  resolve('Cart not updated');
              }

              resolve(cartUpdated);
          })
      })
  })
}

module.exports = {
  cleanUserCart
}