const express = require('express');
const app = express();

const mdAuth = require('../middlewares/auth').verifyToken;
const mdSameUser = require('../middlewares/sameUser').verifyUser;

const User = require('../models/user');
const bcrypt = require('bcrypt');

const contentToRetrive = '_id role email username name favorites';

app.get('/:userId', [mdAuth, mdSameUser], (req, res) => {
    const userId = req.params.userId;

    User.findById(userId, contentToRetrive, (err, userDB) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        if(!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario no encontrado'
            })
        }

        return res.json({
            ok: true,
            user: userDB
        })
    });
})

function checkEmail(newEmail, lastEmail) {
    return new Promise((resolve, reject) => {
        if(newEmail && newEmail !== lastEmail) {
            User.findOne({email: newEmail}, (errFind, userFound) => {
                if(userFound) {
                    reject({
                        ok: false,
                        message: 'El email indicado ya se encuentra en uso'
                    });
                }
    
                resolve(newEmail);
            })
        } else {
            resolve(lastEmail);
        }
    })
    
}

app.put('/:userId', [mdAuth, mdSameUser], (req, res) => {
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
                message: 'Usuario no encontrado'
            })
        }

       if(body.password) {
           userDB.password = bcrypt.hashSync(body.password, 10);
       }

       if(body.favorites) {
           userDB.favorites = body.favorites;
       }

       checkEmail(body.email, userDB.email).then((newEmail) => {
           userDB.email = newEmail;
           userDB.name = body.name;

           userDB.update(userDB, (errUpdt, userUpdated) => {
            if(errUpdt) {
                return res.status(500).json({
                    ok: false,
                    error: errUpdt
                })
            }

            return res.status(200).json({
                ok: true,
                message: 'Has editado tu perfil correctamente'
            })
           })
       })
       .catch((error) => {
           return res.status(400).json(error);
       });
    });
})

module.exports = app;