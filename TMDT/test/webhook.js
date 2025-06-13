// Webhook Stripe: nhận sự kiện thanh toán thành công
app.post("/stripe/webhook", bodyParser.raw({ type: "application/json" }), (request, response) => {
        const sig = request.headers["stripe-signature"];
        let event;
      
        try {
          event = stripe.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
          );
        } catch (err) {
          return response.status(400).send(`Webhook Error: ${err.message}`);
        }
      
        // Xử lý các event Stripe gửi về
        if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object;
          // TODO: Cập nhật trạng thái đơn hàng ở đây
          console.log("Thanh toán thành công:", paymentIntent.id);
        }
      
        response.json({ received: true });
      });