const express = require('express')
const app = express()

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;

const ComboDiscount = require('../models/comboDiscount')

app.get('/combos/get-combo/:imagesAmount', [mdAuth], (req, res) => {

  ComboDiscount.findOne({ imagesAmount: req.params.imagesAmount }, (err, comboDiscount) => {

    if(err) {
      return res.status(500).json({
        ok: false,
        error: err
      })
    }

    return res.status(200).json({
      ok: true,
      discountApplies: (comboDiscount) ? true : false,
      discountPercentage: (comboDiscount) ? comboDiscount.percentage : null
    })

  })

})

app.post('/combos/get-combos', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {

  const pagination = req.body.pagination;

  ComboDiscount.count({}, (errCount, total) => {

    if(errCount) {
      return res.status(500).json({
          ok: false,
          error: errCount
      })
    } 

    const limit = pagination.perPage;
    const skip = (pagination.actualPage * pagination.perPage) - pagination.perPage;

    ComboDiscount.find({})
    .sort([['imagesAmount', 1]])
    .skip(skip)
    .limit(limit)
    .exec( (err, comboDiscounts) => {

      if(err) {
        return res.status(500).json({
          ok: false,
          error: err
        })
      }

      return res.status(200).json({
        ok: true,
        comboDiscounts,
        total,
        skip
      })

    })

  })

})

app.post('/combos', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {

  ComboDiscount.findOne({ imagesAmount: req.body.imagesAmount }, (err, existingComboDiscount) => {
    
    if(err) {
      return res.status(500).json({
        ok: false,
        error: err
      })
    }

    if(existingComboDiscount) {
      return res.status(400).json({
        ok: false,
        message: 'Ya existe un descuento para esa cantidad de imagenes'
      })
    }

    const comboDiscount = new ComboDiscount(req.body)

    comboDiscount.save((errSaving, comboDiscountSaved) => {

      if(errSaving) {
        return res.status(500).json({
          ok: false,
          error: errSaving
        })
      }

      return res.status(201).json({
        ok: true,
        comboDiscountSaved
      })

    })

  })

})

app.delete('/combos/:id', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {

  const id = req.params.id

  ComboDiscount.findByIdAndDelete(id, (err, comboDeleted) => {

    if(err) {
      return res.status(500).json({
        ok: false,
        error: err
      })
    }

    return res.status(200).json({
      ok: true,
      message: 'Combo eliminado correctamente'
    })

  })

})

module.exports = app