const express = require('express');
const router = express.Router();
const { Model, Brand, Vehicle } = require('../models');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/models
 * @desc    Get all models
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const models = await Model.findAll({
      include: [{
        model: Brand,
        attributes: ['id', 'name', 'logo']
      }]
    });

    res.status(200).json({
      success: true,
      count: models.length,
      data: models
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
 * @route   GET /api/models/brand/:brandId
 * @desc    Get models by brand
 * @access  Public
 */
router.get('/brand/:brandId', async (req, res) => {
  try {
    const models = await Model.findAll({
      where: { brand_id: req.params.brandId },
      include: [{
        model: Brand,
        attributes: ['id', 'name', 'logo']
      }]
    });

    res.status(200).json({
      success: true,
      count: models.length,
      data: models
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
 * @route   GET /api/models/:id
 * @desc    Get single model
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const model = await Model.findByPk(req.params.id, {
      include: [{
        model: Brand,
        attributes: ['id', 'name', 'logo']
      }, {
        model: Vehicle,
        attributes: ['id', 'year', 'engine', 'transmission']
      }]
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Modelo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: model
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
 * @route   POST /api/models
 * @desc    Create a model
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, brand_id } = req.body;

    // Check if brand exists
    const brand = await Brand.findByPk(brand_id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }

    // Check if model exists for this brand
    const modelExists = await Model.findOne({
      where: { name, brand_id }
    });

    if (modelExists) {
      return res.status(400).json({
        success: false,
        error: 'Este modelo ya existe para esta marca'
      });
    }

    // Create model
    const model = await Model.create({
      name,
      brand_id
    });

    res.status(201).json({
      success: true,
      data: model
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
 * @route   PUT /api/models/:id
 * @desc    Update model
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, brand_id } = req.body;
    let model = await Model.findByPk(req.params.id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Modelo no encontrado'
      });
    }

    // If brand_id is being updated, check if brand exists
    if (brand_id && brand_id !== model.brand_id) {
      const brand = await Brand.findByPk(brand_id);

      if (!brand) {
        return res.status(404).json({
          success: false,
          error: 'Marca no encontrada'
        });
      }
    }

    // Check if model name already exists for this brand (if name or brand_id is being updated)
    if ((name && name !== model.name) || (brand_id && brand_id !== model.brand_id)) {
      const modelExists = await Model.findOne({
        where: {
          name: name || model.name,
          brand_id: brand_id || model.brand_id
        }
      });

      if (modelExists && modelExists.id !== model.id) {
        return res.status(400).json({
          success: false,
          error: 'Este modelo ya existe para esta marca'
        });
      }
    }

    // Fields to update
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (brand_id) fieldsToUpdate.brand_id = brand_id;

    // Update model
    await model.update(fieldsToUpdate);

    // Get updated model
    model = await Model.findByPk(req.params.id, {
      include: [{
        model: Brand,
        attributes: ['id', 'name', 'logo']
      }]
    });

    res.status(200).json({
      success: true,
      data: model
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
 * @route   DELETE /api/models/:id
 * @desc    Delete model
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const model = await Model.findByPk(req.params.id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Modelo no encontrado'
      });
    }

    // Delete model
    await model.destroy();

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