const { SparePart, SparePartImage, Category, Business, Vehicle, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all spare parts
// @route   GET /api/spare-parts
// @access  Public
exports.getSpareParts = async (req, res) => {
  try {
    const { 
      search, category, business, vehicle, condition, 
      min_price, max_price, featured, 
      sort, page = 1, limit = 10 
    } = req.query;

    // Build query
    const query = {};
    
    // Search by name or description
    if (search) {
      query[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { oem_code: { [Op.like]: `%${search}%` } },
        { reference_codes: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Filter by category
    if (category) query.category_id = category;
    
    // Filter by business
    if (business) query.business_id = business;
    
    // Filter by condition
    if (condition) query.part_condition = condition;
    
    // Filter by price range
    if (min_price) query.price = { ...query.price, [Op.gte]: min_price };
    if (max_price) query.price = { ...query.price, [Op.lte]: max_price };
    
    // Filter by featured
    if (featured) query.featured = featured === 'true';

    // Only show active products
    query.status = 'active';

    // Build sort options
    let order = [];
    if (sort) {
      switch (sort) {
        case 'price_asc':
          order.push(['price', 'ASC']);
          break;
        case 'price_desc':
          order.push(['price', 'DESC']);
          break;
        case 'newest':
          order.push(['created_at', 'DESC']);
          break;
        case 'popular':
          order.push(['sales_count', 'DESC']);
          break;
        default:
          order.push(['created_at', 'DESC']);
      }
    } else {
      order.push(['created_at', 'DESC']);
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Get spare parts
    let sparePartQuery = {
      where: query,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Business,
          attributes: ['id', 'business_name'],
          include: [
            {
              model: User,
              attributes: ['rating']
            }
          ]
        },
        {
          model: SparePartImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main'],
          limit: 1,
          where: { is_main: true },
          required: false
        }
      ]
    };

    // If vehicle filter is applied, add vehicle compatibility
    if (vehicle) {
      sparePartQuery.include.push({
        model: Vehicle,
        as: 'compatibleVehicles',
        attributes: ['id'],
        where: { id: vehicle },
        through: { attributes: [] }
      });
    }

    const { count, rows: spareParts } = await SparePart.findAndCountAll(sparePartQuery);

    res.json({
      success: true,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      data: spareParts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener repuestos'
    });
  }
};

// @desc    Get single spare part
// @route   GET /api/spare-parts/:id
// @access  Public
exports.getSparePart = async (req, res) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Business,
          attributes: ['id', 'business_name', 'location_lat', 'location_lng'],
          include: [
            {
              model: User,
              attributes: ['name', 'rating', 'is_verified']
            },
            {
              model: BusinessPaymentMethod,
              as: 'paymentMethods',
              attributes: ['id', 'payment_type', 'is_active']
            }
          ]
        },
        {
          model: SparePartImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main', 'display_order']
        },
        {
          model: Vehicle,
          as: 'compatibleVehicles',
          include: [
            {
              model: Model,
              include: [{ model: Brand }]
            }
          ]
        },
        {
          model: Review,
          limit: 5,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            attributes: ['name', 'profile_image']
          }]
        }
      ]
    });

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Repuesto no encontrado'
      });
    }

    // Increment views count
    await sparePart.update({ views_count: sparePart.views_count + 1 });

    res.json({
      success: true,
      data: sparePart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener repuesto'
    });
  }
};

// @desc    Create new spare part
// @route   POST /api/spare-parts
// @access  Private/Business
exports.createSparePart = async (req, res) => {
  try {
    // Check if user is a business
    if (req.user.role !== 'business') {
      return res.status(403).json({
        success: false,
        error: 'Solo los usuarios de tipo negocio pueden crear repuestos'
      });
    }

    // Find the business
    const business = await Business.findOne({ where: { user_id: req.user.id } });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de negocio no encontrado'
      });
    }

    const { 
      name, category_id, price, stock, description, 
      oem_code, reference_codes, part_condition, 
      weight, dimensions, featured, compatible_vehicles 
    } = req.body;

    // Create spare part
    const sparePart = await SparePart.create({
      business_id: business.id,
      category_id,
      name,
      oem_code,
      reference_codes,
      price,
      stock,
      featured: featured || false,
      description,
      part_condition: part_condition || 'new',
      weight,
      dimensions,
      status: 'active'
    });

    // Handle images if provided
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file, index) => {
        return SparePartImage.create({
          spare_part_id: sparePart.id,
          image_url: file.path,
          is_main: index === 0, // First image is main
          display_order: index
        });
      });

      await Promise.all(imagePromises);
    }

    // Handle compatible vehicles if provided
    if (compatible_vehicles && compatible_vehicles.length > 0) {
      await sparePart.addCompatibleVehicles(compatible_vehicles);
    }

    res.status(201).json({
      success: true,
      data: sparePart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al crear repuesto'
    });
  }
};

// @desc    Update spare part
// @route   PUT /api/spare-parts/:id
// @access  Private/Business
exports.updateSparePart = async (req, res) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Repuesto no encontrado'
      });
    }

    // Check if user is the owner of the spare part
    const business = await Business.findOne({ where: { user_id: req.user.id } });

    if (!business || sparePart.business_id !== business.id) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para actualizar este repuesto'
      });
    }

    // Update fields
    const { 
      name, category_id, price, stock, description, 
      oem_code, reference_codes, part_condition, 
      weight, dimensions, featured, status, compatible_vehicles 
    } = req.body;

    if (name) sparePart.name = name;
    if (category_id) sparePart.category_id = category_id;
    if (price) sparePart.price = price;
    if (stock !== undefined) sparePart.stock = stock;
    if (description) sparePart.description = description;
    if (oem_code) sparePart.oem_code = oem_code;
    if (reference_codes) sparePart.reference_codes = reference_codes;
    if (part_condition) sparePart.part_condition = part_condition;
    if (weight) sparePart.weight = weight;
    if (dimensions) sparePart.dimensions = dimensions;
    if (featured !== undefined) sparePart.featured = featured;
    if (status) sparePart.status = status;

    await sparePart.save();

    // Handle compatible vehicles if provided
    if (compatible_vehicles && compatible_vehicles.length > 0) {
      await sparePart.setCompatibleVehicles(compatible_vehicles);
    }

    res.json({
      success: true,
      data: sparePart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar repuesto'
    });
  }
};

// @desc    Delete spare part
// @route   DELETE /api/spare-parts/:id
// @access  Private/Business
exports.deleteSparePart = async (req, res) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id);

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        error: 'Repuesto no encontrado'
      });
    }

    // Check if user is the owner of the spare part
    const business = await Business.findOne({ where: { user_id: req.user.id } });

    if (!business || sparePart.business_id !== business.id) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para eliminar este repuesto'
      });
    }

    await sparePart.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar repuesto'
    });
  }
};