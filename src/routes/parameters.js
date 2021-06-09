const express = require('express');
const app = express();

const Parameters = require('../models/parameters');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;


app.get('/', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    Parameters.findOne({}, (err, parametersDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!parametersDB) {
            return res.status(500).json({
                ok: false,
                error: "Parameters not found"
            })
        }

        return res.status(200).json({
            ok: true,
            parameters: parametersDB
        })
    })
})

app.put('/', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {
    Parameters.findOne({}, (err, parametersDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!parametersDB) {
            return res.status(500).json({
                ok: false,
                error: "Parameters not found"
            })
        }

        const parameters = req.body;

        parametersDB.update(parameters, (errUpdt, parametersUpdt) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Parámetros actualizados correctamente'
            })
        })
    })
})


module.exports = app;