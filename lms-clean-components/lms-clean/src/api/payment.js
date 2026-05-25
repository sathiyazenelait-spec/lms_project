import { request } from './auth';

/**
 * Dynamically load Razorpay Checkout Script
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initiate Razorpay checkout modal flow
 */
export const initiatePayment = async (amount, name, email, onSuccess, onError) => {
  try {
    // 1. Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error("Razorpay SDK failed to load. Are you connected to the internet?");
    }

    // 2. Create order on our backend
    const orderData = await request("/payment/create-order", {
      method: "POST",
      body: JSON.stringify({ amount })
    });

    if (!orderData || !orderData.orderId) {
      throw new Error("Failed to create payment order on server");
    }

    // 3. Configure options for checkout modal
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Zenelait LMS",
      description: "Wallet Balance Recharge",
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          // 4. Verify payment signature on backend
          const verification = await request("/payment/verify", {
            method: "POST",
            body: JSON.stringify({
              orderId: orderData.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });

          if (verification && verification.verified) {
            onSuccess({
              orderId: orderData.orderId,
              paymentId: response.razorpay_payment_id
            });
          } else {
            throw new Error("Payment signature verification failed");
          }
        } catch (err) {
          onError(new Error(err.message || "Payment verification failed"));
        }
      },
      prefill: {
        name: name || "",
        email: email || "",
        contact: ""
      },
      theme: {
        color: "#5b4ce8" // Matches Zenelait's brand premium violet color!
      },
      modal: {
        ondismiss: function () {
          onError(new Error("Payment cancelled by user"));
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Razorpay integration error:", error);
    onError(error);
  }
};
