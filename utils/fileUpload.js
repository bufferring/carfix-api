const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Set the destination based on file type
    let uploadPath = process.env.FILE_UPLOAD_PATH;
    
    if (file.fieldname === 'profile_image' || file.fieldname === 'logo' || file.fieldname === 'cover_image') {
      uploadPath += '/profiles';
    } else if (file.fieldname.includes('spare_part')) {
      uploadPath += '/spare_parts';
    } else if (file.fieldname.includes('proof_image')) {
      uploadPath += '/payments';
    } else {
      uploadPath += '/others';
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Create unique filename: fieldname-timestamp-randomstring.ext
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|webp/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB max file size
  fileFilter: fileFilter
});

module.exports = upload;