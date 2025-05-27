const express = require('express');
const router = express.Router();
const { Vehicle, Model, Brand } = require('../models');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      include: [{
        model: Model,
        attributes: ['id', 'name'],
        include: [{
          model: Brand,
          attributes: ['id', 'name', 'logo']
        }]
      }]
    });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
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
 * @route   GET /api/vehicles/:id
 * @desc    Get single vehicle
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{
        model: Model,
        attributes: ['id', 'name'],
        include: [{
          model: Brand,
          attributes: ['id', 'name', 'logo']
        }]
      }]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
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
 * @route   GET /api/vehicles/model/:modelId
 * @desc    Get vehicles by model
 * @access  Public
 */
router.get('/model/:modelId', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { model_id: req.params.modelId },
      include: [{
        model: Model,
        attributes: ['id', 'name'],
        include: [{
          model: Brand,
          attributes: ['id', 'name', 'logo']
        }]
      }]
    });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
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
 * @route   POST /api/vehicles
 * @desc    Create a vehicle
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { model_id, year, engine, transmission } = req.body;

    // Check if model exists
    const model = await Model.findByPk(model_id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Modelo no encontrado'
      });
    }

    // Check if vehicle exists for this model and year
    const vehicleExists = await Vehicle.findOne({
      where: { model_id, year, engine, transmission }
    });

    if (vehicleExists) {
      return res.status(400).json({
        success: false,
        error: 'Este vehículo ya existe'
      });
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      model_id,
      year,
      engine,
      transmission
    });

    res.status(201).json({
      success: true,
      data: vehicle
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
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { model_id, year, engine, transmission } = req.body;
    let vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    // If model_id is being updated, check if model exists
    if (model_id && model_id !== vehicle.model_id) {
      const model = await Model.findByPk(model_id);

      if (!model) {
        return res.status(404).json({
          success: false,
          error: 'Modelo no encontrado'
        });
      }
    }

    // Check if vehicle already exists with these details
    if (model_id || year || engine || transmission) {
      const vehicleExists = await Vehicle.findOne({
        where: {
          model_id: model_id || vehicle.model_id,
          year: year || vehicle.year,
          engine: engine || vehicle.engine,
          transmission: transmission || vehicle.transmission
        }
      });

      if (vehicleExists && vehicleExists.id !== vehicle.id) {
        return res.status(400).json({
          success: false,
          error: 'Este vehículo ya existe'
        });
      }
    }

    // Fields to update
    const fieldsToUpdate = {};
    if (model_id) fieldsToUpdate.model_id = model_id;
    if (year) fieldsToUpdate.year = year;
    if (engine) fieldsToUpdate.engine = engine;
    if (transmission) fieldsToUpdate.transmission = transmission;

    // Update vehicle
    await vehicle.update(fieldsToUpdate);

    // Get updated vehicle
    vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{
        model: Model,
        attributes: ['id', 'name'],
        include: [{
          model: Brand,
          attributes: ['id', 'name', 'logo']
        }]
      }]
    });

    res.status(200).json({
      success: true,
      data: vehicle
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
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    // Delete vehicle
    await vehicle.destroy();

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