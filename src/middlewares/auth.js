var jwt = require('jsonwebtoken');
var jwtKey = require('../config/vars').jwtKey;

//==========================================
// Validating token
//==========================================

module.exports.verifyToken = function( req, res, next ){

    console.log(__dirname);

    var token = req.query.token;

    jwt.verify( token, jwtKey, ( err, decoded ) => {

        if(err){
            return res.status(401).json({
                ok: false,
                message: 'Token invalido!',
                errors: err
            })
        }
        
        req.user = decoded.user;

        next();

    })


}
