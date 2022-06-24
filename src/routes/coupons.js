const express = require('express')
const app = express()

const mdAuth = require('../middlewares/auth').verifyToken;
const mdRole = require('../middlewares/role').verifyRole;

const Coupon = require('../models/coupon')

app.get('/get-coupon/:code', [mdAuth], (req, res) => {

  Coupon.findOne({ code: req.params.code }, (err, coupon) => {

    if(err) {
      return res.status(500).json({
        ok: false,
        error: err
      })
    }

    return res.status(200).json({
      ok: true,
      coupon
    })

  })

})

app.post('/get-coupons', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {

  const pagination = req.body.pagination;

  Coupon.count({}, (errCount, total) => {

    if(errCount) {
      return res.status(500).json({
          ok: false,
          error: errCount
      })
    } 

    const limit = pagination.perPage;
    const skip = (pagination.actualPage * pagination.perPage) - pagination.perPage;

    Coupon.find({})
    .sort([['discountPercentage', 1]])
    .skip(skip)
    .limit(limit)
    .exec( (err, coupons) => {

      if(err) {
        return res.status(500).json({
          ok: false,
          error: err
        })
      }

      return res.status(200).json({
        ok: true,
        coupons,
        total,
        skip
      })

    })

  })

})

app.post('/', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {

  Coupon.findOne({ code: req.body.code }, (err, existingCoupon) => {
    
    if(err) {
      return res.status(500).json({
        ok: false,
        error: err
      })
    }

    if(existingCoupon) {
      return res.status(400).json({
        ok: false,
        message: 'Ya existe un cupón con ese código'
      })
    }

    const coupon = new Coupon(req.body)

    coupon.save((errSaving, couponSaved) => {

      if(errSaving) {
        return res.status(500).json({
          ok: false,
          error: errSaving
        })
      }

      return res.status(201).json({
        ok: true,
        couponSaved
      })

    })

  })

})

app.delete('/:id', [mdAuth, mdRole(['ADMIN_ROLE'])], (req, res) => {

  const id = req.params.id

  Coupon.findByIdAndDelete(id, (err, couponDeleted) => {

    if(err) {
      return res.status(500).json({
        ok: false,
        error: err
      })
    }

    return res.status(200).json({
      ok: true,
      message: 'Cupón eliminado correctamente'
    })

  })

})

module.exports = app