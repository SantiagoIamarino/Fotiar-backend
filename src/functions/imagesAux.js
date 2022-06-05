const Image = require('../models/image')

const getImages = (images) => {
  return new Promise((resolve, reject) => {
    const imagesId = [];

    images.forEach(image => {
      if(imagesId.indexOf(image.imageId._id) < 0) {
        imagesId.push(image.imageId._id);
      }
    })

    Image.find({ _id: { $in: imagesId } }, (err, imagesFound) => {
      if(err) {
        reject(error);
      }

      resolve(imagesFound);
    })
  })
}

// User is allowed to see original image if:
  // is admin OR is the image owner OR is the photographer owner
const checkImageAuthorization = (user) => {

    switch (user.role) {
      case 'ADMIN_ROLE':
        return true
        break;

      case 'USER_ROLE':

        if(user.purchases.indexOf(this.image._id) >= 0) {
          return true
        }
        
        break;
      
      case 'PHOTOGRAPHER_ROLE':
        
        if(this.image.ownerId == user._id) {
          return true
        }
        
        break;
    
      default:
        break;
    }

    return false

  }

module.exports = {
  getImages,
  checkImageAuthorization
}