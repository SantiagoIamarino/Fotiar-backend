
//==========================================
// Validating role
//==========================================

module.exports.verifyRole = (rolesAllowed = ['ADMIN_ROLE']) => {
    return function( req, res, next ){

        const user = req.user;
    
        if(rolesAllowed.indexOf(user.role) < 0) {
            return res.status(401).json({
                ok: false,
                message: 'No tienes acceso a esa ruta'
            })
        }
    
        next();

    }
}

