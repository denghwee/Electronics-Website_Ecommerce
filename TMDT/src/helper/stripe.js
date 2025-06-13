const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Tạo link thanh toán Stripe Checkout (Promise)
 * @param {Object} params - Các tham số cần thiết cho thanh toán
 * @returns {Promise<string>} - Trả về link thanh toán Stripe (url)
 */
function stripe_get_link({
        amount, // số tiền, đơn vị nhỏ nhất (cent)
        currency = 'vnd',
        orderInfo = "Pay with Stripe",
        successUrl = process.env.STRIPE_RETURN_URL,
        cancelUrl = process.env.STRIPE_CANCEL_URL,
        metadata
    } = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency,
                        product_data: {
                            name: orderInfo,
                        },
                        unit_amount: amount, // Ví dụ: 5000 là $50.00 nếu "usd"
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: successUrl + `/${metadata.order_id}`,
                cancel_url: cancelUrl,
                metadata,
                payment_intent_data: {
                    metadata, // metadata này sẽ được copy vào payment_intent!
                  }
            });

            if (session.url) {
                resolve(session.url);
            } else {
                reject('Không lấy được url từ Stripe');
            }
        } catch (error) {
            reject('Stripe error: ' + error.message);
        }
    });
}

module.exports = stripe_get_link;