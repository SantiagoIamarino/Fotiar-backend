const express = require('express');
const multer = require('multer');

const app = express();

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "C:/Users/santi/Desktop/Fotiar/backend/src/images/");
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
});

let uploadFile = multer({
    storage: storage,
}).any("uploads");


app.post('/', (req, res) => {

    uploadFile(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.log(err); //Multer error
        } else if (err) {
            console.log(err); //Some other error
        }

        return res.status(200).json({
            ok: true,
            message: 'Imagenes subidas correctamente'
        })
    })
})


module.exports = app;