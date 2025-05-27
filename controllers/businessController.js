const { Business, User, BusinessPaymentMethod, SparePart } = require('../models');

// @desc    Get all businesses
// @route   GET /api/businesses
// @access  Public
exports.getBusinesses = async (req, res) => {
  try {
    const businesses = await Business.findAll({
      include: [
        {
          model: User,
          attributes: ['name', 'email', 'phone', 'rating', 'is_verified']
        }
      ]
    });

    res.json({
      success: true,
      count: businesses.length,
      data: businesses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener negocios'
    });
  }
};

// @desc    Get single business
// @route   GET /api/businesses/:id
// @access  Public
exports.getBusiness = async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email', 'phone', 'rating', 'is_verified', 'description']
        },
        {
          model: BusinessPaymentMethod,
          as: 'paymentMethods',
          attributes: ['id', 'payment_type', 'account_details', 'is_active']
        }
      ]
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado'
      });
    }

    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener negocio'
    });
  }
};

// @desc    Update business profile
// @route   PUT /api/businesses/profile
// @access  Private/Business
exports.updateBusinessProfile = async (req, res) => {
  try {
    // Check if user is a business
    if (req.user.role !== 'business') {
      return res.status(403).json({
        success: false,
        error: 'Solo los usuarios de tipo negocio pueden actualizar un perfil de negocio'
      });
    }

    // Find the business
    let business = await Business.findOne({ where: { user_id: req.user.id } });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de negocio no encontrado'
      });
    }

    // Update business fields
    business.business_name = req.body.business_name || business.business_name;
    business.rif = req.body.rif || business.rif;
    
    if (req.body.location_lat) business.location_lat = req.body.location_lat;
    if (req.body.location_lng) business.location_lng = req.body.location_lng;
    if (req.body.schedule) business.schedule = req.body.schedule;
    if (req.body.social_media) business.social_media = req.body.social_media;
    
    // Handle logo and cover image uploads if provided
    if (req.files) {
      if (req.files.logo) {
        business.logo = req.files.logo[0].path;
      }
      if (req.files.cover_image) {
        business.cover_image = req.files.cover_image[0].path;
      }
    }

    await business.save();

    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar perfil de negocio'
    });
  }
};

// @desc    Add payment method to business
// @route   POST /api/businesses/payment-methods
// @access  Private/Business
exports.addPaymentMethod = async (req, res) => {
  try {
    // Check if user is a business
    if (req.user.role !== 'business') {
      return res.status(403).json({
        success: false,
        error: 'Solo los usuarios de tipo negocio pueden agregar métodos de pago'
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

    const { payment_type, account_details } = req.body;

    // Validate required fields
    if (!payment_type || !account_details) {
      return res.status(400).json({
        success: false,
        error: 'Por favor proporcione el tipo de pago y los detalles de la cuenta'
      });
    }

    // Create payment method
    const paymentMethod = await BusinessPaymentMethod.create({
      business_id: business.id,
      payment_type,
      account_details,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al agregar método de pago'
    });
  }
};

// @desc    Get business spare parts
// @route   GET /api/businesses/:id/spare-parts
// @access  Public
exports.getBusinessSpareParts = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, featured, condition, sort, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { business_id: id };
    
    if (category) query.category_id = category;
    if (featured) query.featured = featured === 'true';
    if (condition) query.part_condition = condition;

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
    const { count, rows: spareParts } = await SparePart.findAndCountAll({
      where: query,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: SparePartImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main'],
          limit: 1,
          where: { is_main: true },
          required: false
        }
      ]
    });

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
      error: 'Error al obtener repuestos del negocio'
    });
  }
};