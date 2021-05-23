
//==========================================
// Validating same user
//==========================================

module.exports.verifyUser = function( req, res, next ){

    const user = req.user;
    const userId = req.params.userId;

    if(req.user._id !== userId && req.user.role !== 'ADMIN_ROLE') {
        return res.status(401).json({
            ok: false,
            message: 'No tienes acceso a esa ruta'
        })
    }

    next();


}
