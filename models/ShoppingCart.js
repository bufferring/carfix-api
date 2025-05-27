const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShoppingCart = sequelize.define('ShoppingCart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  tableName: 'shopping_carts',
  timestamps: false
});

module.exports = ShoppingCart;