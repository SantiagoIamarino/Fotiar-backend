const express = require('express')
const axios = require('axios')

const { updateUserPurchases, getUserById } = require('../functions/usersAux')
const { getOrderByFilters, updateOrderStatus } = require('../functions/orderAux')

const app = express()

const {
  MP_ACCESS_TOKEN
} = process.env

const config = {
  headers: {
    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
  }
}

const getDataFromUrl = (url) => {

  return new Promise((resolve, reject) => {

    axios.get(url, config).then((resp) => {
      resolve(resp.data)
    })
    .catch(error => reject(error))

  })
    
}

const endProccess = (res) => {
  return res.status(200).json({
    ok: true
  })
}

app.post('/', async (req, res) => {

  console.log(req.body)

  if(!req.body.topic) {
    return endProccess(res)
  }

  if(!req.body.resource) {
    return endProccess(res)
  }

  if(req.body.topic !== 'merchant_order') {
    return endProccess(res)
  }

  try {

    const data = await getDataFromUrl(req.body.resource)

    if(data.order_status !== 'paid') {
      return endProccess(res)
    }

    const orderId = data.external_reference;
    const orderDB = await getOrderByFilters({ 
      orderId: orderId, 
      status: 'pending' 
    })

    if(!orderDB) {
      return endProccess(res)
    }

    orderDB.status = 'completed'
    await updateOrderStatus(orderDB._id, orderDB)

    const userDB = await getUserById(orderDB.userId)

    orderDB.images.forEach(imageId => {

      if(userDB.purchases.indexOf(imageId) < 0) {
        userDB.purchases.push(imageId);
      }

    });

    await updateUserPurchases(userDB)
  
    return endProccess(res)

  } catch (error) {
    console.log(error)
  }
    
})

module.exports = app