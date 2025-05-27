const express = require('express');
const router = express.Router();
const { SparePart, SparePartImage, Business, User, Category, Vehicle, Model, Brand } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

/**
 * @route   GET /api/spare-parts
 * @desc    Get all spare parts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const spareParts = await SparePart.findAll({
      include: [
        {
          model: Business,
          attributes: ['id', 'business_name', 'logo'],
          include: [{
            model: User,
            attributes: ['id', 'name', 'rating']
          }]
        },
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          attributes: ['id', 'year', 'engine', 'transmission'],
          include: [{
            model: Model,
            attributes: ['id', 'name'],
            include: [{
              model: Brand,
              attributes: ['id', 'name', 'logo']
            }]
          }]
        },
        {
          model: SparePartImage,
          attributes: ['id', 'image_url']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: spareParts.length,
      data: spareParts
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
 * @route   GET /api/spare-parts/:id
 * @desc    Get single spare part
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id, {
      include: [
        {
          model: Business,
          attributes: ['id', 'business_name', 'logo', 'location_lat', 'location_lng', 'schedule', 'social_media'],
          include: [{
            model: User,
            attributes: ['id', 'name', 'email', 'phone', 'rating', 'is_verified']
          }]
        },
        {
          model: Category,
          attributes: ['id', 'name', 'description']
        },
        {
          model: Vehicle,
          attributes: ['id', 'year', 'engine', 'transmission'],
          include: [{
            model: Model,
            attributes: ['id', 'name'],
            include: [{
              model: Brand,
              attributes: ['id', 'name', 'logo']
            }]
          }]
        },
        {
          model: SparePartImage,
          attributes: ['id', 'image_url']
        }
      ]
    });

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Repuesto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: sparePart
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
 * @route   GET /api/spare-parts/business/:businessId
 * @desc    Get spare parts by business
 * @access  Public
 */
router.get('/business/:businessId', async (req, res) => {
  try {
    const spareParts = await SparePart.findAll({
      where: { business_id: req.params.businessId },
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          attributes: ['id', 'year', 'engine', 'transmission'],
          include: [{
            model: Model,
            attributes: ['id', 'name'],
            include: [{
              model: Brand,
              attributes: ['id', 'name', 'logo']
            }]
          }]
        },
        {
          model: SparePartImage,
          attributes: ['id', 'image_url']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: spareParts.length,
      data: spareParts
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
 * @route   GET /api/spare-parts/category/:categoryId
 * @desc    Get spare parts by category
 * @access  Public
 */
router.get('/category/:categoryId', async (req, res) => {
  try {
    const spareParts = await SparePart.findAll({
      where: { category_id: req.params.categoryId },
      include: [
        {
          model: Business,
          attributes: ['id', 'business_name', 'logo'],
          include: [{
            model: User,
            attributes: ['id', 'name', 'rating']
          }]
        },
        {
          model: Vehicle,
          attributes: ['id', 'year', 'engine', 'transmission'],
          include: [{
            model: Model,
            attributes: ['id', 'name'],
            include: [{
              model: Brand,
              attributes: ['id', 'name', 'logo']
            }]
          }]
        },
        {
          model: SparePartImage,
          attributes: ['id', 'image_url']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: spareParts.length,
      data: spareParts
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
 * @route   GET /api/spare-parts/vehicle/:vehicleId
 * @desc    Get spare parts by vehicle
 * @access  Public
 */
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const spareParts = await SparePart.findAll({
      where: { vehicle_id: req.params.vehicleId },
      include: [
        {
          model: Business,
          attributes: ['id', 'business_name', 'logo'],
          include: [{
            model: User,
            attributes: ['id', 'name', 'rating']
          }]
        },
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: SparePartImage,
          attributes: ['id', 'image_url']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: spareParts.length,
      data: spareParts
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
 * @route   POST /api/spare-parts
 * @desc    Create a spare part
 * @access  Private/Business
 */
router.post('/', protect, authorize('business'), async (req, res) => {
  try {
    const { name, description, price, stock, condition, category_id, vehicle_id } = req.body;

    // Check if business exists for this user
    const business = await Business.findOne({
      where: { user_id: req.user.id }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado para este usuario'
      });
    }

    // Check if category exists
    const category = await Category.findByPk(category_id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findByPk(vehicle_id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehículo no encontrado'
      });
    }

    // Create spare part
    const sparePart = await SparePart.create({
      name,
      description,
      price,
      stock,
      condition,
      business_id: business.id,
      category_id,
      vehicle_id
    });

    res.status(201).json({
      success: true,
      data: sparePart
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
 * @route   POST /api/spare-parts/:id/images
 * @desc    Upload spare part images
 * @access  Private/Business
 */
router.post('/:id/images', protect, authorize('business'), upload.array('images', 5), async (req, res) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id, {
      include: [{
        model: Business,
        attributes: ['id', 'user_id']
      }]
    });

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Repuesto no encontrado'
      });
    }

    // Make sure user is business owner
    if (sparePart.Business.user_id.toString() !== req.user.id.toString()) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para actualizar este repuesto'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba al menos una imagen'
      });
    }

    // Create spare part images
    const sparePartImages = [];

    for (const file of req.files) {
      const sparePartImage = await SparePartImage.create({
        spare_part_id: sparePart.id,
        image_url: `/uploads/spare-parts/${file.filename}`
      });

      sparePartImages.push(sparePartImage);
    }

    res.status(201).json({
      success: true,
      count: sparePartImages.length,
      data: sparePartImages
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
 * @route   PUT /api/spare-parts/:id
 * @desc    Update spare part
 * @access  Private/Business
 */
router.put('/:id', protect, authorize('business', 'admin'), async (req, res) => {
  try {
    const { name, description, price, stock, condition, category_id, vehicle_id } = req.body;
    
    let sparePart = await SparePart.findByPk(req.params.id, {
      include: [{
        model: Business,
        attributes: ['id', 'user_id']
      }]
    });

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Repuesto no encontrado'
      });
    }

    // Make sure user is business owner or admin
    if (sparePart.Business.user_id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para actualizar este repuesto'
      });
    }

    // If category_id is being updated, check if category exists
    if (category_id && category_id !== sparePart.category_id) {
      const category = await Category.findByPk(category_id);

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Categoría no encontrada'
        });
      }
    }

    // If vehicle_id is being updated, check if vehicle exists
    if (vehicle_id && vehicle_id !== sparePart.vehicle_id) {
      const vehicle = await Vehicle.findByPk(vehicle_id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehículo no encontrado'
        });
      }
    }

    // Fields to update
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (description) fieldsToUpdate.description = description;
    if (price) fieldsToUpdate.price = price;
    if (stock !== undefined) fieldsToUpdate.stock = stock;
    if (condition) fieldsToUpdate.condition = condition;
    if (category_id) fieldsToUpdate.category_id = category_id;
    if (vehicle_id) fieldsToUpdate.vehicle_id = vehicle_id;

    // Update spare part
    await sparePart.update(fieldsToUpdate);

    // Get updated spare part
    sparePart = await SparePart.findByPk(req.params.id, {
      include: [
        {
          model: Business,
          attributes: ['id', 'business_name', 'logo'],
          include: [{
            model: User,
            attributes: ['id', 'name', 'rating']
          }]
        },
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          attributes: ['id', 'year', 'engine', 'transmission'],
          include: [{
            model: Model,
            attributes: ['id', 'name'],
            include: [{
              model: Brand,
              attributes: ['id', 'name', 'logo']
            }]
          }]
        },
        {
          model: SparePartImage,
          attributes: ['id', 'image_url']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: sparePart
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
 * @route   DELETE /api/spare-parts/:id
 * @desc    Delete spare part
 * @access  Private/Business
 */
router.delete('/:id', protect, authorize('business', 'admin'), async (req, res) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id, {
      include: [{
        model: Business,
        attributes: ['id', 'user_id']
      }]
    });

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Repuesto no encontrado'
      });
    }

    // Make sure user is business owner or admin
    if (sparePart.Business.user_id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para eliminar este repuesto'
      });
    }

    // Delete spare part
    await sparePart.destroy();

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

/**
 * @route   DELETE /api/spare-parts/image/:imageId
 * @desc    Delete spare part image
 * @access  Private/Business
 */
router.delete('/image/:imageId', protect, authorize('business', 'admin'), async (req, res) => {
  try {
    const sparePartImage = await SparePartImage.findByPk(req.params.imageId, {
      include: [{
        model: SparePart,
        attributes: ['id', 'business_id'],
        include: [{
          model: Business,
          attributes: ['id', 'user_id']
        }]
      }]
    });

    if (!sparePartImage) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    // Make sure user is business owner or admin
    if (sparePartImage.SparePart.Business.user_id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para eliminar esta imagen'
      });
    }

    // Delete spare part image
    await sparePartImage.destroy();

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