const express = require('express');
const app = express();
const bcrypt = require('bcrypt');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;

const User = require('../models/user');

const contentToRetrieve = 'name username email createdAt role favorites purchases purchasesNetAmount observation';

app.post('/get-users', [mdAuth, mdRole], (req, res) => {
    User.find({}, contentToRetrieve)
        .exec((err, users) => {
            if(err) {
                return res.status(500).json({
                    ok: false,
                    error: err
                })
            }

            return res.status(200).json({
                ok: true,
                users
            })
        })
} )

app.post('/', [mdAuth, mdRole], (req, res) => {
    const body = req.body;

    User.findOne({
        $or: [ {email: body.email}, {username: body.username} ]
    }, (err, userDB)  => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(userDB) {
            return res.status(400).json({
                ok: false,
                message: 'Ya se encuentra un usuario registrado con ese email/alias'
            })
        }

        body.password = bcrypt.hashSync(body.password, 10);

        const user = new User(body);

        user.save((errUser, userSaved) => {
            if(errUser) {
                return res.status(500).json({
                    ok: false,
                    error: errUser
                })
            }

            return res.status(201).json({
                ok: true,
                message: 'Usuario creado correctamente'
            })
        })
    })
})

app.put('/:userId', [mdAuth, mdRole], (req, res) => {
    const userId = req.params.userId;
    const body = req.body;

    User.findById(userId, (err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un usuario con esa ID'
            })
        }

        body.password = bcrypt.hashSync(body.password, 10);

        userDB.update(body, (errUpdt, userUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Usuario modificado correctamente'
            })
        })
    })
})

app.delete('/:userId', [mdAuth, mdRole], (req, res) => {
    const userId = req.params.userId;

    User.findById(userId, (err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un usuario con esa ID'
            })
        }

        userDB.delete((errDlt, userDeleted) => {
            if(errDlt) {
                return res.status(500).json({
                    ok: false,
                    error: errDlt
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Usuario eliminado correctamente'
            })
        })
    })
})


module.exports = app;