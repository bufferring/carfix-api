const { User, Business } = require('../models');
const upload = require('../utils/fileUpload');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Business,
          as: 'business',
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Update basic user fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.description = req.body.description || user.description;
    
    // Only update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Handle profile image upload if provided
    if (req.file) {
      user.profile_image = req.file.path;
    }

    // Save user changes
    await user.save();

    // If user is a business, update business info
    if (user.role === 'business' && (req.body.business_name || req.body.rif)) {
      let business = await Business.findOne({ where: { user_id: user.id } });
      
      if (business) {
        business.business_name = req.body.business_name || business.business_name;
        business.rif = req.body.rif || business.rif;
        
        if (req.body.location_lat) business.location_lat = req.body.location_lat;
        if (req.body.location_lng) business.location_lng = req.body.location_lng;
        if (req.body.schedule) business.schedule = req.body.schedule;
        if (req.body.social_media) business.social_media = req.body.social_media;
        
        await business.save();
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        description: user.description,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar perfil'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
};