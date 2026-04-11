import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Razorpay
  let razorpay: Razorpay | null = null;
  
  const getRazorpay = () => {
    if (!razorpay) {
      const key_id = process.env.RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_id || !key_secret) {
        throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required");
      }
      razorpay = new Razorpay({
        key_id,
        key_secret,
      });
    }
    return razorpay;
  };

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create Razorpay Order
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      const rzp = getRazorpay();
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency,
        receipt,
      };

      const order = await rzp.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  // Verify Razorpay Payment (Webhook or Frontend verification)
  app.post("/api/razorpay/verify", (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_secret) {
        return res.status(500).json({ error: "Razorpay secret key not configured" });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        // Payment is successful
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
