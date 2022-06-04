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

module.exports = {
  getImages
}