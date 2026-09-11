import { Router } from "express";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const plans = {
  m1: { months: 1, amount: 9900, label: "1 month Premium" },
  m2: { months: 2, amount: 14900, label: "2 months Premium" },
  m3: { months: 3, amount: 19900, label: "3 months Premium" },
  m6: { months: 6, amount: 39900, label: "6 months Premium" },
  y1: { months: 12, amount: 59900, label: "1 year Premium" },
};
function gateway() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw new Error("Payment gateway is not configured");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}
router.post("/order", requireAuth, async (req, res) => {
  try {
    const plan = plans[req.body.planId];
    if (!plan) return res.status(400).json({ message: "Invalid plan" });
    const order = await gateway().orders.create({
      amount: plan.amount,
      currency: "INR",
      receipt: `${req.user.id}-${Date.now()}`,
      notes: { planId: req.body.planId, userId: req.user.id },
    });
    await Order.create({
      user: req.user.id,
      planId: req.body.planId,
      amount: plan.amount,
      razorpayOrderId: order.id,
    });
    res.json({
      orderId: order.id,
      amount: plan.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
      planLabel: plan.label,
    });
  } catch (e) {
    res.status(503).json({ message: e.message });
  }
});
router.post("/verify", requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } =
      req.body,
    plan = plans[planId];
  if (!plan) return res.status(400).json({ message: "Invalid plan" });
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected),
    receivedBuffer = Buffer.from(String(razorpay_signature || ""));
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  )
    return res.status(400).json({ message: "Payment signature is invalid" });
  const order = await Order.findOne({
    razorpayOrderId: razorpay_order_id,
    user: req.user.id,
  });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "paid") {
    const start = new Date(),
      base =
        req.user.subscription?.expiresAt > start
          ? req.user.subscription.expiresAt
          : start,
      expires = new Date(base);
    expires.setMonth(expires.getMonth() + plan.months);
    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        subscription: {
          planId,
          status: "active",
          startsAt: start,
          expiresAt: expires,
          razorpayPaymentId: razorpay_payment_id,
        },
      },
    });
    order.status = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();
  }
  res.json({ success: true });
});
export default router;
