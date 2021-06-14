const express = require('express');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

var mercadopago = require('mercadopago');
mercadopago.configurations.setAccessToken("TEST-2250573947337888-111301-a3d1541cf8e11603c5f12f1998b40338-222073650");

const app = express();

app.post('/mercadopago/:userId', [mdAuth, mdSameUser, mdRole(['CLIENT_ROLE'])], (req, res) => {
    const payment_data = {
        transaction_amount: Number(req.body.total),
        token: req.body.mercadopago.token,
        description: "Compra de imagenes Fotiar",
        installments: Number(req.body.mercadopago.installementChoosed),
        payment_method_id: req.body.mercadopago.paymentMethod,
        payer: {
            email: req.body.email,
            identification: {
                type: req.body.docType,
                number: req.body.docNumber
            }
        }
    };

    mercadopago.payment.save(payment_data)
        .then((response) => {
            if(response.status == 'approved') {
                
            } else {
                return res.status(response.status).json({
                    response,
                    status: response.body.status,
                    status_detail: response.body.status_detail,
                    id: response.body.id
                });
            }
            
        })
        .catch((error) => {
            return res.status(400).json({
                ok: false,
                error
            });
        });
    })

module.exports = app;