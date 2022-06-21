
const Order = require('../models/order')

const getOrderByFilters = (filters = {}) => {

  return new Promise((resolve, reject) => {

    Order.findOne(filters, (err, orderDB) => {

      if(err) {
        reject(err)
      }
  
      resolve(orderDB)
      
    })

  })
  
}

const updateOrderStatus = (orderId, orderData) => {

  return new Promise((resolve, reject) => {

    Order.findByIdAndUpdate(orderId, orderData, (err, orderUpdated) => {
      if(err) {
        reject(err)
      }

      resolve(orderUpdated)
    })

  })
  
}

module.exports = {
  getOrderByFilters,
  updateOrderStatus
}