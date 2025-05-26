const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BusinessPaymentMethod = sequelize.define('BusinessPaymentMethod', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_type: {
    type: DataTypes.ENUM('zelle', 'pagomovil', 'transferencia', 'efectivo', 'otro'),
    allowNull: false
  },
  account_details: {
    type: DataTypes.JSON,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'business_payment_methods',
  timestamps: false
});

module.exports = BusinessPaymentMethod;