const { promisify } = require("util")
const index = require("../../models/customer/index.model")
const order = require("../../models/customer/order.model")
const general = require("../../models/general.model")
const account = require("../../models/customer/account.model")

const crypto = require('crypto');
const request = require('request');
const https = require('https');

const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



const momo_get_link = require('../../helper/momo');
const stripe_get_link = require('../../helper/stripe');

const orderController = () => { }

// [POST] /order/addCart
orderController.addCart = async (req, res) => {
	let customer_id = 0

	if (req.user) {
		customer_id = req.user.customer_id
	} else {
		return res.status(401).json({
			status: "NotAuth",
		})
	}

	let product_variant_id = req.body.product_variant_id
	let cart_quantity = req.body.cart_quantity

	let result = await order.addCart(
		customer_id,
		product_variant_id,
		cart_quantity
	)

	if (result) {
		return res.json({
			status: "success",
		})
	} else {
		return res.json({
			status: "error",
		})
	}
}

// [GET] /order/cart
orderController.cart = async (req, res) => {
	customer_id = req.user.customer_id
	let header_user = await index.header_user(req)
	let header = await index.header(req)
	let detailCart = await order.getDetailCart(customer_id)
	let formatFunction = await general.formatFunction()

	res.render("./pages/order/cart", {
		header: header,
		user: header_user,
		detailCart: detailCart,
		formatFunction: formatFunction,
	})
}

// [POST] /order/cart/delete
orderController.deleteCart = async (req, res) => {
	let customer_id = req.user.customer_id
	let productsCartDelete = req.body

	order.deleteCart(customer_id, productsCartDelete, function (err, success) {
		if (success) {
			return res.status(200).json({
				status: "success",
			})
		} else {
			return res.status(404).json({
				status: "error",
			})
		}
	})
}

// [POST] /order/cart/update
orderController.updateCart = async (req, res) => {
	let customer_id = req.user.customer_id
	let productsCartUpdate = req.body.productsCartUpdate
	let productsCartUpdateOld = req.body.productsCartUpdateOld

	await order.deleteCart(customer_id, productsCartUpdate, function (err, success) { })
	await order.deleteCart(customer_id, productsCartUpdateOld, function (err, success) { })

	await order.updateCart(customer_id, productsCartUpdate, function (err, success) {
		if (success) {
			return res.status(200).json({
				status: "success",
			})
		} else {
			return res.status(404).json({
				status: "error",
			})
		}
	})
}

// [GET] /order/information
orderController.information = async (req, res) => {
	let header_user = await index.header_user(req)
	let header = await index.header(req)
	let formatFunction = await general.formatFunction()

	res.render("./pages/order/information", {
		header: header,
		user: header_user,
		formatFunction: formatFunction,
	})
}

// [POST] /order/information
orderController.informationPost = async (req, res) => {
	let orderInformation = req.body

	let customer_id = req.user.customer_id
	let orderInfo = orderInformation.orderInfo
	let orderDetails = orderInformation.orderDetails

	order.insertOrder(
		customer_id,
		orderInfo,
		orderDetails,
		function (err, success, order_id, paying_method_id) {
			if (err) {
				return res.status(404).json({
					status: "error",
				})
			} else if (success) {
				order.deleteCart(customer_id, orderDetails, function (err, success) { })
				res.status(200).json({
					status: "success",
					order_id: order_id,
					paying_method_id: orderInfo.paying_method_id,
				})
			}
		}
	)
}

// [GET] /order/payment?paying_method_id=x&order_id=y
orderController.payment = async (req, res) => {
	let paying_method_id = req.query.paying_method_id
	let order_id = req.query.order_id

	let customer_id = req.user.customer_id
	let header_user = await index.header_user(req)
	let header = await index.header(req)
	let formatFunction = await general.formatFunction()

	let purchase = await account.getPurchaseHistory(customer_id, 0, order_id)
	let name = purchase[0].order_name;

	if (paying_method_id == 1) {
		// res.render("./pages/order/momo", {
		// 	header: header,
		// 	user: header_user,
		// 	formatFunction: formatFunction,
		// 	purchase: purchase[0],
		// })

		let totalAmount = 0;
		if (purchase[0] && Array.isArray(purchase[0].order_details)) {
			totalAmount = purchase[0].order_details.reduce(
				(sum, detail) => sum + (detail.order_detail_price_after || 0), 0
			);
		}

		try {
			const url = await momo_get_link({
				amount: totalAmount,
				orderInfo: `Thanh toán đơn hàng ${order_id} của ${name}`

			});
			return res.redirect(url);
		} catch (err) {
			return res.status(400).send(err);
		}
	} else if (paying_method_id == 2) {
		// res.render("./pages/order/atm", {
		// 	header: header,
		// 	user: header_user,
		// 	formatFunction: formatFunction,
		// 	purchase: purchase[0],
		// })


		let totalAmount = 0;
		if (purchase[0] && Array.isArray(purchase[0].order_details)) {
			totalAmount = purchase[0].order_details.reduce(
				(sum, detail) => sum + (detail.order_detail_price_after || 0), 0
			);
		}

		try {
			const url = await stripe_get_link({
				amount: totalAmount,
				orderInfo: `Thanh toán đơn hàng ${order_id} của ${name}`,

				metadata: { order_id: order_id }

			});
			return res.redirect(url);
		} catch (err) {
			return res.status(400).send(err);
		}
	} else if (paying_method_id == 3) {
		res.render("./pages/order/credit", {
			header: header,
			user: header_user,
			formatFunction: formatFunction,
			purchase: purchase[0],
		})
	}
}

orderController.webhook = async (req, res) => {
	const sig = req.headers['stripe-signature'];
	let event;

	try {
		event = stripe.webhooks.constructEvent(
			req.body,
			sig,
			process.env.STRIPE_SECRET_WEBHOOK
		);
	} catch (err) {
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	if (event.type === 'payment_intent.succeeded') {
		const paymentIntent = event.data.object;
		console.log('Thanh toán thành công:', paymentIntent.metadata.order_id);

		// Cập nhật đơn hàng với payment_intent_id
		const order_id = paymentIntent.metadata.order_id;
		if (order_id) {
			await order.updateOrder(order_id, {
				order_is_paid: 1,
				order_status: 'Đang giao hàng',
				payment_intent_id: paymentIntent.id
			});
			// console.log('Order updated with payment_intent_id:', paymentIntent.id);
		}
	}

	res.json({ received: true });
};
orderController.cancelOrder = async (req, res) => {
	let order_id = req.body.order_id;

	await order.updateCancelOrder(order_id, function (err, success) {
		if (err) {
			res.status(404).json({
				status: 'error',
			})
		} else {
			res.status(200).json({
				status: 'success',
			})
		}
	})
}

orderController.refund = async (req, res) => {
	console.log('Refund request received:', req.body);
	const order_id = req.body.order_id;
	const customer_id = req.user.customer_id;

	try {
		// Lấy thông tin đơn hàng
		const purchase = await account.getPurchaseHistory(customer_id, 0, order_id);

		if (!purchase || purchase.length === 0) {
			return res.status(404).json({
				status: 'error',
				message: 'Không tìm thấy đơn hàng'
			});
		}

		const orderData = purchase[0];

		// Kiểm tra trạng thái đơn hàng
		if (orderData.order_status !== 'Đang giao hàng') {
			return res.status(400).json({
				status: 'error',
				message: 'Chỉ có thể hoàn tiền cho đơn hàng đang giao'
			});
		}

		// Kiểm tra phương thức thanh toán
		if (orderData.paying_method_id !== 2) { // 2 là ID của Stripe
			return res.status(400).json({
				status: 'error',
				message: 'Chỉ có thể hoàn tiền cho đơn hàng thanh toán qua thẻ tín dụng'
			});
		}

		// Tính tổng tiền cần hoàn
		let totalAmount = 0;
		if (orderData.order_details && Array.isArray(orderData.order_details)) {
			totalAmount = orderData.order_details.reduce(
				(sum, detail) => sum + (detail.order_detail_price_after || 0), 0
			);
		}

		// Lấy payment intent ID
		const paymentIntentId = await order.getPaymentIntentId(order_id);

		if (!paymentIntentId) {
			return res.status(400).json({
				status: 'error',
				message: 'Không tìm thấy thông tin thanh toán'
			});
		}

		// Thực hiện hoàn tiền qua Stripe
		const refund = await stripe.refunds.create({
			payment_intent: paymentIntentId,
			amount: totalAmount,
			reason: 'requested_by_customer'
		});

		if (refund.status === 'succeeded') {
			// Cập nhật trạng thái đơn hàng thành "Đã hủy"
			await order.updateCancelOrder(order_id);

			return res.status(200).json({
				status: 'success',
				message: 'Hoàn tiền thành công',
				refund_id: refund.id
			});
		} else {
			return res.status(400).json({
				status: 'error',
				message: 'Hoàn tiền thất bại'
			});
		}
	} catch (error) {
		console.error('Refund error:', error);
		return res.status(500).json({
			status: 'error',
			message: 'Có lỗi xảy ra khi hoàn tiền: ' + error.message
		});
	}
};

module.exports = orderController
