const axios = require('axios')
const mercadopago = require("mercadopago")

const {
  MP_USER_ID,
  MP_EXTERNAL_POS_ID,
  MP_ACCESS_TOKEN,
  MP_SPONSOR_ID,
  MP_NOTIFICATIONS_URL,
  FRONT_URL
} = process.env

mercadopago.configure({
  access_token: MP_ACCESS_TOKEN,
})

const config = {
  headers: {
    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
  }
}

const generateMPOrderQR = (data, orderId) => {

  let url = "https://api.mercadopago.com/instore/orders/qr/seller/collectors/"
  url +=  `${MP_USER_ID}/pos/${MP_EXTERNAL_POS_ID}/qrs`

  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 2)

  const orderData = {
    "external_reference": orderId,
    "title": "Compra de imagenes - Fotiar",
    "description": "Compra de imagenes - Fotiar",
    "notification_url": MP_NOTIFICATIONS_URL,
    "expiration_date": expirationDate.toISOString(),
    "total_amount": data.amount,
    "items": data.items,
    "sponsor": {
      "id": parseInt(MP_SPONSOR_ID)
    }
  }

  return axios.post(url, orderData, config)

}

const generatePreference = (data, orderId) => {
  console.log(MP_NOTIFICATIONS_URL)
  // Crea un objeto de preferencia
  let preference = {
    items: data.items,
    back_urls: {
      success: `${FRONT_URL}/#/mercadopago/payment/success`,
      failure: `${FRONT_URL}/#/mercadopago/payment/failure`,
      pending: `${FRONT_URL}/#/mercadopago/payment/pending`
    },
    notification_url: MP_NOTIFICATIONS_URL,
    external_reference: orderId,
    auto_return: "approved",
  };

  return mercadopago.preferences.create(preference)

}

module.exports = {
  generateMPOrderQR,
  generatePreference
}