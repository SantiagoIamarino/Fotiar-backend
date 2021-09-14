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

function generateCopy(file) {
    return new Promise((resolve, reject) => {
        const LOGO = filesUrl + "logo.png";

        const LOGO_MARGIN_PERCENTAGE = 5;
    
        const main = async () => {
            const [image, logo] = await Promise.all([
                Jimp.read(file.path),
                Jimp.read(LOGO)
            ]);
    
            logo.resize(image.bitmap.width, Jimp.AUTO);
    
            const xMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;
            const yMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;
    
            const X = 0;
            const Y = 0;
    
            return image
                .composite(logo, X, Y, [{
                    mode: Jimp.BLEND_SCREEN,
                    opacitySource: 0.1,
                    opacityDest: 1
                }])
                .quality(30)
                .resize(
                    Math.round(image.bitmap.width / 10),
                    Math.round(image.bitmap.height / 10)
                );
        };
    
        main().then(image => { 
            const copyFileName = 'copy-' + file.filename;
            image.write(filesUrl + 'users/' + copyFileName);
            resolve(copyFileName);
        }).catch((error) => {
            console.log(error);
            return res.status(500).json({
                ok: false,
                error
            })
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