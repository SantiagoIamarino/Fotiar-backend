
//==========================================
// Validating image owner
//==========================================

module.exports.verifyOwner = function( req, res, next ) {

    // Verifying if this user has uploaded the image or if is an ADMIN
    const ownerId = (req.params.ownerId) ? req.params.ownerId : req.query.ownerId;

    if(req.user._id == ownerId || req.user.role == 'ADMIN_ROLE') {
        req.isOwnerOrAdmin = true;
        next();

        return;
    }

    //Verifying if this user has bought this image
    const imageId = req.query.imageId;
    
    if(req.user.purchases.indexOf(imageId) >= 0) {
        req.isOwnerOrAdmin = false;
        next();
        
        return;
    }

    // Access not granted
    return res.status(401).json({
        ok: false,
        message: 'No tienes acceso a esa ruta'
    })
    

}
