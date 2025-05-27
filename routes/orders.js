const express = require('express');
const router = express.Router();
const { Order, OrderDetail, SparePart, Business, User, Payment } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

/**
 * @route   GET /api/orders
 * @desc    Get all orders (admin only)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'name', 'price'],
            include: [{
              model: Business,
              attributes: ['id', 'business_name']
            }]
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status', 'payment_date', 'payment_proof']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
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
 * @route   GET /api/orders/my-orders
 * @desc    Get logged in user orders
 * @access  Private
 */
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'name', 'price'],
            include: [{
              model: Business,
              attributes: ['id', 'business_name']
            }]
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status', 'payment_date', 'payment_proof']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
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
 * @route   GET /api/orders/business-orders
 * @desc    Get orders for business
 * @access  Private/Business
 */
router.get('/business-orders', protect, authorize('business'), async (req, res) => {
  try {
    // Get business id for this user
    const business = await Business.findOne({
      where: { user_id: req.user.id }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Negocio no encontrado para este usuario'
      });
    }

    // Find all orders that contain spare parts from this business
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            where: { business_id: business.id },
            attributes: ['id', 'name', 'price']
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status', 'payment_date', 'payment_proof']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
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
 * @route   GET /api/orders/:id
 * @desc    Get single order
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'name', 'price', 'description', 'condition'],
            include: [{
              model: Business,
              attributes: ['id', 'business_name', 'logo']
            }]
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status', 'payment_date', 'payment_proof']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Make sure user is order owner, business owner of any spare part in the order, or admin
    if (req.user.role === 'admin') {
      // Admin can access any order
    } else if (req.user.role === 'business') {
      // Check if user is business owner of any spare part in the order
      const business = await Business.findOne({
        where: { user_id: req.user.id }
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          error: 'Negocio no encontrado para este usuario'
        });
      }

      const hasBusinessSparePart = order.OrderDetails.some(
        detail => detail.SparePart.business_id === business.id
      );

      if (!hasBusinessSparePart) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado para ver esta orden'
        });
      }
    } else if (order.user_id.toString() !== req.user.id.toString()) {
      // Customer can only access their own orders
      return res.status(401).json({
        success: false,
        error: 'No autorizado para ver esta orden'
      });
    }

    res.status(200).json({
      success: true,
      data: order
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
 * @route   POST /api/orders
 * @desc    Create an order
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { items, shipping_address, payment_method } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Por favor agregue al menos un artículo a la orden'
      });
    }

    // Validate items and calculate total
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const sparePart = await SparePart.findByPk(item.spare_part_id);

      if (!sparePart) {
        return res.status(404).json({
          success: false,
          error: `Repuesto con ID ${item.spare_part_id} no encontrado`
        });
      }

      if (sparePart.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${sparePart.name}`
        });
      }

      const itemTotal = sparePart.price * item.quantity;
      total += itemTotal;

      validatedItems.push({
        spare_part_id: sparePart.id,
        quantity: item.quantity,
        price: sparePart.price,
        subtotal: itemTotal
      });

      // Update stock
      await sparePart.update({
        stock: sparePart.stock - item.quantity
      });
    }

    // Create order
    const order = await Order.create({
      user_id: req.user.id,
      total,
      status: 'pending',
      shipping_address
    });

    // Create order details
    for (const item of validatedItems) {
      await OrderDetail.create({
        order_id: order.id,
        spare_part_id: item.spare_part_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      });
    }

    // Create payment
    await Payment.create({
      order_id: order.id,
      amount: total,
      payment_method,
      status: 'pending'
    });

    // Get created order with details
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'name', 'price'],
            include: [{
              model: Business,
              attributes: ['id', 'business_name']
            }]
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdOrder
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
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin/Business
 */
router.put('/:id/status', protect, authorize('admin', 'business'), async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderDetail,
        include: [{
          model: SparePart,
          attributes: ['id', 'business_id']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // If user is business, check if they own any spare part in the order
    if (req.user.role === 'business') {
      const business = await Business.findOne({
        where: { user_id: req.user.id }
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          error: 'Negocio no encontrado para este usuario'
        });
      }

      const hasBusinessSparePart = order.OrderDetails.some(
        detail => detail.SparePart.business_id === business.id
      );

      if (!hasBusinessSparePart) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado para actualizar esta orden'
        });
      }
    }

    // Update order status
    await order.update({ status });

    // Get updated order
    order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'name', 'price'],
            include: [{
              model: Business,
              attributes: ['id', 'business_name']
            }]
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status', 'payment_date', 'payment_proof']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: order
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
 * @route   PUT /api/orders/:id/payment
 * @desc    Upload payment proof and update payment status
 * @access  Private
 */
router.put('/:id/payment', protect, upload.single('payment_proof'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: Payment
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Make sure user is order owner
    if (order.user_id.toString() !== req.user.id.toString()) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para actualizar esta orden'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor suba un comprobante de pago'
      });
    }

    // Update payment
    await order.Payment.update({
      payment_proof: `/uploads/payments/${req.file.filename}`,
      status: 'processing',
      payment_date: new Date()
    });

    // Update order status
    await order.update({
      status: 'processing'
    });

    // Get updated order
    const updatedOrder = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'name', 'price'],
            include: [{
              model: Business,
              attributes: ['id', 'business_name']
            }]
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status', 'payment_date', 'payment_proof']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedOrder
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
 * @route   PUT /api/orders/:id/payment/status
 * @desc    Update payment status (admin or business only)
 * @access  Private/Admin/Business
 */
router.put('/:id/payment/status', protect, authorize('admin', 'business'), async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Payment
        },
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'business_id']
          }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // If user is business, check if they own any spare part in the order
    if (req.user.role === 'business') {
      const business = await Business.findOne({
        where: { user_id: req.user.id }
      });

      if (!business) {
        return res.status(404).json({
          success: false,
          error: 'Negocio no encontrado para este usuario'
        });
      }

      const hasBusinessSparePart = order.OrderDetails.some(
        detail => detail.SparePart.business_id === business.id
      );

      if (!hasBusinessSparePart) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado para actualizar esta orden'
        });
      }
    }

    // Update payment status
    await order.Payment.update({ status });

    // If payment is completed, update order status to processing
    if (status === 'completed') {
      await order.update({ status: 'processing' });
    }

    // If payment is rejected, update order status to cancelled
    if (status === 'rejected') {
      await order.update({ status: 'cancelled' });

      // Restore stock for each item
      for (const detail of order.OrderDetails) {
        const sparePart = await SparePart.findByPk(detail.spare_part_id);
        await sparePart.update({
          stock: sparePart.stock + detail.quantity
        });
      }
    }

    // Get updated order
    order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: OrderDetail,
          include: [{
            model: SparePart,
            attributes: ['id', 'name', 'price'],
            include: [{
              model: Business,
              attributes: ['id', 'business_name']
            }]
          }]
        },
        {
          model: Payment,
          attributes: ['id', 'amount', 'payment_method', 'status', 'payment_date', 'payment_proof']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: order
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
 * @route   DELETE /api/orders/:id
 * @desc    Cancel order (only if status is pending)
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderDetail
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Make sure user is order owner or admin
    if (order.user_id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para cancelar esta orden'
      });
    }

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden cancelar órdenes pendientes'
      });
    }

    // Update order status to cancelled
    await order.update({ status: 'cancelled' });

    // Restore stock for each item
    for (const detail of order.OrderDetails) {
      const sparePart = await SparePart.findByPk(detail.spare_part_id);
      await sparePart.update({
        stock: sparePart.stock + detail.quantity
      });
    }

    // Update payment status to cancelled
    await Payment.update(
      { status: 'cancelled' },
      { where: { order_id: order.id } }
    );

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