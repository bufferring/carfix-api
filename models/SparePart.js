const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SparePart = sequelize.define('SparePart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  oem_code: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  reference_codes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  discount_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  part_condition: {
    type: DataTypes.ENUM('new', 'used', 'refurbished'),
    defaultValue: 'new'
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  dimensions: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sales_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    defaultValue: 'active'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'spare_parts',
  timestamps: false
});

module.exports = SparePart;