const express = require('express');
const app = express();
const Image = require('../models/image');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

app.post('/:userId', [mdAuth, mdSameUser], (req, res) => {
    const body = req.body;

    const image = new Image(body);

    image.save((err, imageSaved) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        return res.status(201).json({
            ok: true,
            message: 'Imagen guardada correctamente'
        })
    })
})

module.exports = app;