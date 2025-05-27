const { Model, Brand, Vehicle } = require('../models');

// @desc    Get all models
// @route   GET /api/models
// @access  Public
exports.getModels = async (req, res) => {
  try {
    const { brand_id } = req.query;
    
    const query = {};
    if (brand_id) query.brand_id = brand_id;

    const models = await Model.findAll({
      where: query,
      include: [
        {
          model: Brand,
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: models.length,
      data: models
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener modelos'
    });
  }
};

// @desc    Get single model
// @route   GET /api/models/:id
// @access  Public
exports.getModel = async (req, res) => {
  try {
    const model = await Model.findByPk(req.params.id, {
      include: [
        {
          model: Brand,
          attributes: ['id', 'name', 'logo']
        },
        {
          model: Vehicle,
          as: 'vehicles',
          attributes: ['id', 'year', 'engine', 'transmission']
        }
      ]
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Modelo no encontrado'
      });
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener modelo'
    });
  }
};

// @desc    Create new model
// @route   POST /api/models
// @access  Private/Admin
exports.createModel = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para crear modelos'
      });
    }

    const { name, brand_id } = req.body;

    // Check if brand exists
    const brand = await Brand.findByPk(brand_id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
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
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al crear modelo'
    });
  }
};

// @desc    Update model
// @route   PUT /api/models/:id
// @access  Private/Admin
exports.updateModel = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para actualizar modelos'
      });
    }

    const model = await Model.findByPk(req.params.id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Modelo no encontrado'
      });
    }

    const { name, brand_id } = req.body;

    // If brand_id is changing, check if new brand exists
    if (brand_id && brand_id !== model.brand_id) {
      const brand = await Brand.findByPk(brand_id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          error: 'Marca no encontrada'
        });
      }
    }

    // Update fields
    if (name) model.name = name;
    if (brand_id) model.brand_id = brand_id;

    await model.save();

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar modelo'
    });
  }
};

// @desc    Delete model
// @route   DELETE /api/models/:id
// @access  Private/Admin
exports.deleteModel = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para eliminar modelos'
      });
    }

    const model = await Model.findByPk(req.params.id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Modelo no encontrado'
      });
    }

    // Check if model has vehicles
    const vehicles = await Vehicle.count({
      where: { model_id: req.params.id }
    });

    if (vehicles > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un modelo con vehículos asociados'
      });
    }

    await model.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar modelo'
    });
  }
};