const express = require('express');
const multer = require('multer');

const mdAuth = require('../middlewares/auth').verifyToken;
const mdImageOwner = require('../middlewares/imageOwner').verifyOwner;

const Jimp = require("jimp");
const path = require('path');
const filesUrl = require('../config/vars').filesPath;
const fs = require('fs');

const app = express();

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, filesUrl + 'users/');
    },
    filename: (req, file, cb) => {
        const fileName = new Date().getTime() + '-' + file.originalname;
      cb(null, fileName);
    },
});

let uploadFile = multer({
    storage: storage,
}).single("uploads");

function getNewImageSizes(image, orientation) {
    const originalSizes = image.bitmap;
    let sizes = {
        height: originalSizes.height,
        width: originalSizes.width
    }

    if(orientation == 1) { // Horizontal
        if(originalSizes.width <= 1000) {
            return sizes;
        }

        sizes.width = (originalSizes.width / (originalSizes.width / 1000));
        sizes.height = (originalSizes.height / (originalSizes.width / 1000));

    } else { // Vertical
        if(originalSizes.height <= 600) {
            return sizes;
        }

        sizes.width = (originalSizes.width / (originalSizes.height / 600));
        sizes.height = (originalSizes.height / (originalSizes.height / 600));
    }


    return sizes;
}

function generateCopy(file) {
    return new Promise((resolve, reject) => {
        const LOGO = filesUrl + "logo.png";

        const LOGO_MARGIN_PERCENTAGE = 5;
    
        const main = async () => {
            const [image, logo] = await Promise.all([
                Jimp.read(file.path),
                Jimp.read(LOGO)
            ]);

            const orientation = (image?._exif?.tags?.Orientation) ? image._exif.tags.Orientation : 1;
            
            if(orientation == 1) {
                logo.resize(image.bitmap.width, Jimp.AUTO);
            } else {
                logo.resize(Jimp.AUTO, image.bitmap.height);
            }
    
            const X = 0;
            const Y = 0;

            const sizes = getNewImageSizes(image, orientation);
            const rotation = (orientation == 8) ? 270 : 0;
    
            return image
                .composite(logo, X, Y, [{
                    mode: Jimp.BLEND_SCREEN,
                    opacitySource: 0.1,
                    opacityDest: 1
                }])
                .quality(40)
                .resize(
                    Math.round(sizes.width),
                    Math.round(sizes.height)
                )
                .rotate(rotation);
        };
    
        main().then(image => { 
            const copyFileName = 'copy-' + file.filename;
            image.write(filesUrl + 'users/' + copyFileName);
            resolve(copyFileName);
        }).catch((error) => {
            console.log(error);
            reject(error);
        })
    })
    
}


app.post('/', (req, res) => {

    uploadFile(req, res, (err) => {
        if(err) {
            return res.status(500).json({
                ok: false,
                error: err
            })
        }

        const fileName = req.file.filename;

        generateCopy(req.file).then((copyFileName) => {
            return res.status(200).json({
                ok: true,
                message: 'Imagenes subidas correctamente',
                fileName,
                copyFileName
            })
        }).catch((error) => {
            return res.status(500).json({
                ok: false,
                error
            })
        })
    })
})

app.get('/download/:filename', [mdAuth, mdImageOwner], (req, res) => {
    const { filename } = req.params;
    const fullFilePath = path.join(filesUrl, 'users/' + filename);
    const defaultImagePath = path.join(filesUrl, 'default.png');

    if(fs.existsSync(fullFilePath)) {
        return res.download(fullFilePath);
    } else {
        return res.download(defaultImagePath);
    }
    
});


module.exports = app;