const { Brand, Model, Vehicle } = require('../models');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener marcas'
    });
  }
};

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id, {
      include: [
        {
          model: Model,
          as: 'models',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener marca'
    });
  }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private/Admin
exports.createBrand = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para crear marcas'
      });
    }

    const { name } = req.body;

    // Create brand
    const brand = await Brand.create({
      name,
      logo: req.file ? req.file.path : null
    });

    res.status(201).json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al crear marca'
    });
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para actualizar marcas'
      });
    }

    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }

    const { name } = req.body;

    // Update fields
    if (name) brand.name = name;
    if (req.file) brand.logo = req.file.path;

    await brand.save();

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar marca'
    });
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para eliminar marcas'
      });
    }

    const brand = await Brand.findByPk(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Marca no encontrada'
      });
    }

    // Check if brand has models
    const models = await Model.count({
      where: { brand_id: req.params.id }
    });

    if (models > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una marca con modelos asociados'
      });
    }

    await brand.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar marca'
    });
  }
};