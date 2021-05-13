
//==========================================
// Validating role
//==========================================

module.exports.verifyRole = function( req, res, next ){

    const user = req.user;

    if(req.user.role !== 'ADMIN_ROLE') {
        return res.status(401).json({
            ok: false,
            message: 'No tienes acceso a esa ruta'
        })
    }

    next();


}
