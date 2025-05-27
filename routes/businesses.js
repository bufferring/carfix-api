const express = require('express');
const router = express.Router();
const { Business, User, BusinessPaymentMethod } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

/**
 * @route   GET /api/businesses
 * @desc    Get all businesses
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const businesses = await Business.findAll({
      include: [{
        model: User,
        attributes: ['name', 'email', 'phone', 'rating', 'is_verified']
      }]
    });

    res.status(200).json({
      success: true,
      count: businesses.length,
      data: businesses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

/**
 * @route   GET /api/businesses/:id
 * @desc    Get single business
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['name', 'email', 'phone', 'rating', 'is_verified']
      }, {
        model: BusinessPaymentMethod,
        attributes: ['id', 'payment_type', 'account_details', 'is_active']
      }]
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

/**
 * @route   POST /api/businesses
 * @desc    Create a business
 * @access  Private/Business
 */
router.post('/', protect, authorize('business'), async (req, res) => {
  try {
    // Check if user already has a business
    const existingBusiness = await Business.findOne({
      where: { user_id: req.user.id }
    });

    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: 'Este usuario ya tiene un negocio registrado'
      });
    }

    // Create business
    const business = await Business.create({
      user_id: req.user.id,
      business_name: req.body.business_name,
      rif: req.body.rif,
      location_lat: req.body.location_lat,
      location_lng: req.body.location_lng,
      schedule: req.body.schedule,
      social_media: req.body.social_media
    });

    res.status(201).json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

/**
 * @route   PUT /api/businesses/:id
 * @desc    Update business
 * @access  Private/Business
 */
router.put('/:id', protect, authorize('business', 'admin'), async (req, res) => {
  try {
    let business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    // Make sure user is business owner or admin
    if (business.user_id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para actualizar este negocio'
      });
    }

    // Fields to update
    const { business_name, rif, location_lat, location_lng, schedule, social_media } = req.body;
    const fieldsToUpdate = {};

    if (business_name) fieldsToUpdate.business_name = business_name;
    if (rif) fieldsToUpdate.rif = rif;
    if (location_lat) fieldsToUpdate.location_lat = location_lat;
    if (location_lng) fieldsToUpdate.location_lng = location_lng;
    if (schedule) fieldsToUpdate.schedule = schedule;
    if (social_media) fieldsToUpdate.social_media = social_media;

    // Update business
    await business.update(fieldsToUpdate);

    // Get updated business
    business = await Business.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['name', 'email', 'phone', 'rating', 'is_verified']
      }]
    });

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

/**
 * @route   PUT /api/businesses/:id/logo
 * @desc    Upload business logo
 * @access  Private/Business
 */
router.put('/:id/logo', protect, authorize('business', 'admin'), upload.single('logo'), async (req, res) => {
  try {
    let business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    // Make sure user is business owner or admin
    if (business.user_id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para actualizar este negocio'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba un archivo'
      });
    }

    // Update logo
    await business.update({
      logo: `/uploads/profiles/${req.file.filename}`
    });

    // Get updated business
    business = await Business.findByPk(req.params.id);

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

/**
 * @route   PUT /api/businesses/:id/cover
 * @desc    Upload business cover image
 * @access  Private/Business
 */
router.put('/:id/cover', protect, authorize('business', 'admin'), upload.single('cover_image'), async (req, res) => {
  try {
    let business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    // Make sure user is business owner or admin
    if (business.user_id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para actualizar este negocio'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba un archivo'
      });
    }

    // Update cover image
    await business.update({
      cover_image: `/uploads/profiles/${req.file.filename}`
    });

    // Get updated business
    business = await Business.findByPk(req.params.id);

    res.status(200).json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

/**
 * @route   DELETE /api/businesses/:id
 * @desc    Delete business
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    // Delete business
    await business.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

module.exports = router;