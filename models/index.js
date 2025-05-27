const User = require('./User');
const Business = require('./Business');
const Category = require('./Category');
const Brand = require('./Brand');
const Model = require('./Model');
const Vehicle = require('./Vehicle');
const SparePart = require('./SparePart');
const SparePartImage = require('./SparePartImage');
const Review = require('./Review');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Payment = require('./Payment');
const BusinessPaymentMethod = require('./BusinessPaymentMethod');
const ShoppingCart = require('./ShoppingCart');
const CartItem = require('./CartItem');
const Wishlist = require('./Wishlist');

// Define associations

// User - Business (One-to-One)
User.hasOne(Business, { foreignKey: 'user_id' });
Business.belongsTo(User, { foreignKey: 'user_id' });

// Business - SparePart (One-to-Many)
Business.hasMany(SparePart, { foreignKey: 'business_id' });
SparePart.belongsTo(Business, { foreignKey: 'business_id' });

// Business - BusinessPaymentMethod (One-to-Many)
Business.hasMany(BusinessPaymentMethod, { foreignKey: 'business_id' });
BusinessPaymentMethod.belongsTo(Business, { foreignKey: 'business_id' });

// Category - SparePart (One-to-Many)
Category.hasMany(SparePart, { foreignKey: 'category_id' });
SparePart.belongsTo(Category, { foreignKey: 'category_id' });

// Remove the duplicate self-referencing associations since they're already defined in Category.js
// Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });
// Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Brand - Model (One-to-Many)
Brand.hasMany(Model, { foreignKey: 'brand_id' });
Model.belongsTo(Brand, { foreignKey: 'brand_id' });

// Model - Vehicle (One-to-Many)
Model.hasMany(Vehicle, { foreignKey: 'model_id' });
Vehicle.belongsTo(Model, { foreignKey: 'model_id' });

// SparePart - SparePartImage (One-to-Many)
SparePart.hasMany(SparePartImage, { foreignKey: 'spare_part_id' });
SparePartImage.belongsTo(SparePart, { foreignKey: 'spare_part_id' });

// SparePart - Vehicle (Many-to-Many)
SparePart.belongsToMany(Vehicle, { through: 'spare_part_vehicle', foreignKey: 'spare_part_id' });
Vehicle.belongsToMany(SparePart, { through: 'spare_part_vehicle', foreignKey: 'vehicle_id' });

// User - SparePart (Reviews) (One-to-Many)
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });
SparePart.hasMany(Review, { foreignKey: 'spare_part_id' });
Review.belongsTo(SparePart, { foreignKey: 'spare_part_id' });

// User - SparePart (Wishlist) (Many-to-Many)
User.belongsToMany(SparePart, { through: Wishlist, foreignKey: 'user_id' });
SparePart.belongsToMany(User, { through: Wishlist, foreignKey: 'spare_part_id' });

// User - ShoppingCart (One-to-One)
User.hasOne(ShoppingCart, { foreignKey: 'user_id' });
ShoppingCart.belongsTo(User, { foreignKey: 'user_id' });

// ShoppingCart - CartItem (One-to-Many)
ShoppingCart.hasMany(CartItem, { foreignKey: 'cart_id' });
CartItem.belongsTo(ShoppingCart, { foreignKey: 'cart_id' });

// CartItem - SparePart (Many-to-One)
SparePart.hasMany(CartItem, { foreignKey: 'spare_part_id' });
CartItem.belongsTo(SparePart, { foreignKey: 'spare_part_id' });

// User - Order (One-to-Many)
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

// Business - Order (One-to-Many)
Business.hasMany(Order, { foreignKey: 'business_id' });
Order.belongsTo(Business, { foreignKey: 'business_id' });

// Order - OrderDetail (One-to-Many)
Order.hasMany(OrderDetail, { foreignKey: 'order_id' });
OrderDetail.belongsTo(Order, { foreignKey: 'order_id' });

// OrderDetail - SparePart (Many-to-One)
SparePart.hasMany(OrderDetail, { foreignKey: 'spare_part_id' });
OrderDetail.belongsTo(SparePart, { foreignKey: 'spare_part_id' });

// User - Payment (One-to-Many)
User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

// Business - Payment (One-to-Many)
Business.hasMany(Payment, { foreignKey: 'business_id' });
Payment.belongsTo(Business, { foreignKey: 'business_id' });

// BusinessPaymentMethod - Payment (One-to-Many)
BusinessPaymentMethod.hasMany(Payment, { foreignKey: 'payment_method_id' });
Payment.belongsTo(BusinessPaymentMethod, { foreignKey: 'payment_method_id' });

// Payment - Order (One-to-One)
Payment.hasOne(Order, { foreignKey: 'payment_id' });
Order.belongsTo(Payment, { foreignKey: 'payment_id' });

module.exports = {
  User,
  Business,
  Category,
  Brand,
  Model,
  Vehicle,
  SparePart,
  SparePartImage,
  Review,
  Order,
  OrderDetail,
  Payment,
  BusinessPaymentMethod,
  ShoppingCart,
  CartItem,
  Wishlist
};