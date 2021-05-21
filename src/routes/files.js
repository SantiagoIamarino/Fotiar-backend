const express = require('express');
const multer = require('multer');

const Jimp = require("jimp");

const app = express();

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "C:/Users/santi/Desktop/Fotiar/backend/src/images/");
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
        const LOGO = "C:/Users/santi/Desktop/Fotiar/backend/src/logo.png";

        const LOGO_MARGIN_PERCENTAGE = 5;
    
        const main = async () => {
            const [image, logo] = await Promise.all([
                Jimp.read(file.path),
                Jimp.read(LOGO)
            ]);
    
            logo.resize(image.bitmap.width / 8, Jimp.AUTO);
    
            const xMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;
            const yMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;
    
            const X = image.bitmap.width - logo.bitmap.width - xMargin;
            const Y = image.bitmap.height - logo.bitmap.height - yMargin;
    
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
            image.write('./src/images/' + copyFileName);
            resolve(copyFileName);
        });
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


module.exports = app;