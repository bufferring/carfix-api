const express = require('express');
const router = express.Router();
const { Brand, Model } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

/**
 * @route   GET /api/brands
 * @desc    Get all brands
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.findAll({
      include: [{
        model: Model,
        attributes: ['id', 'name']
      }]
    });

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands
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
 * @route   GET /api/brands/:id
 * @desc    Get single brand
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id, {
      include: [{
        model: Model,
        attributes: ['id', 'name']
      }]
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: brand
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
 * @route   POST /api/brands
 * @desc    Create a brand
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;

    // Check if brand exists
    const brandExists = await Brand.findOne({ where: { name } });

    if (brandExists) {
      return res.status(400).json({
        success: false,
        error: 'Esta marca ya existe'
      });
    }

    // Create brand
    const brand = await Brand.create({
      name
    });

    res.status(201).json({
      success: true,
      data: brand
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
 * @route   PUT /api/brands/:id
 * @desc    Update brand
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    let brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }

    // Check if brand name already exists (if name is being updated)
    if (name && name !== brand.name) {
      const brandExists = await Brand.findOne({ where: { name } });

      if (brandExists) {
        return res.status(400).json({
          success: false,
          error: 'Esta marca ya existe'
        });
      }
    }

    // Update brand
    await brand.update({ name });

    // Get updated brand
    brand = await Brand.findByPk(req.params.id, {
      include: [{
        model: Model,
        attributes: ['id', 'name']
      }]
    });

    res.status(200).json({
      success: true,
      data: brand
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
 * @route   PUT /api/brands/:id/logo
 * @desc    Upload brand logo
 * @access  Private/Admin
 */
router.put('/:id/logo', protect, authorize('admin'), upload.single('logo'), async (req, res) => {
  try {
    let brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
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
    await brand.update({
      logo: `/uploads/profiles/${req.file.filename}`
    });

    // Get updated brand
    brand = await Brand.findByPk(req.params.id);

    res.status(200).json({
      success: true,
      data: brand
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
 * @route   DELETE /api/brands/:id
 * @desc    Delete brand
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }

    // Delete brand
    await brand.destroy();

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