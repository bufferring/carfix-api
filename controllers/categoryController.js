const { Category, SparePart } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const { parent_id } = req.query;
    
    const query = {};
    
    // If parent_id is provided, filter by parent
    // If parent_id is null or 'null', get root categories
    if (parent_id === 'null' || parent_id === null) {
      query.parent_id = null;
    } else if (parent_id) {
      query.parent_id = parent_id;
    }

    const categories = await Category.findAll({
      where: query,
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'image']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categorías'
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'image', 'description']
        },
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Get spare parts count for this category
    const sparePartsCount = await SparePart.count({
      where: {
        category_id: req.params.id,
        status: 'active'
      }
    });

    // Get subcategories spare parts count
    const subcategoriesIds = category.children.map(subcat => subcat.id);
    const subcategoriesSparePartsCount = subcategoriesIds.length > 0 
      ? await SparePart.count({
          where: {
            category_id: { [Op.in]: subcategoriesIds },
            status: 'active'
          }
        })
      : 0;

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        sparePartsCount,
        subcategoriesSparePartsCount,
        totalSparePartsCount: sparePartsCount + subcategoriesSparePartsCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categoría'
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para crear categorías'
      });
    }

    const { name, description, parent_id } = req.body;

    // Create category
    const category = await Category.create({
      name,
      description,
      parent_id: parent_id || null,
      image: req.file ? req.file.path : null
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al crear categoría'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para actualizar categorías'
      });
    }

    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    const { name, description, parent_id } = req.body;

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (parent_id !== undefined) category.parent_id = parent_id || null;
    if (req.file) category.image = req.file.path;

    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar categoría'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para eliminar categorías'
      });
    }

    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Check if category has subcategories
    const subcategories = await Category.count({
      where: { parent_id: req.params.id }
    });

    if (subcategories > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una categoría con subcategorías'
      });
    }

    // Check if category has spare parts
    const spareParts = await SparePart.count({
      where: { category_id: req.params.id }
    });

    if (spareParts > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una categoría con repuestos asociados'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar categoría'
    });
  }
};