
//==========================================
// Validating image owner
//==========================================

module.exports.verifyOwner = function( req, res, next ){
    const ownerId = (req.params.ownerId) ? req.params.ownerId : req.query.ownerId;

    if(req.user._id !== ownerId && req.user.role !== 'ADMIN_ROLE') {
        return res.status(401).json({
            ok: false,
            message: 'No tienes acceso a esa ruta'
        })
    }

    next();


}
