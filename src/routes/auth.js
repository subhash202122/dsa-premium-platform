import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const clean = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  isPremium: u.isPremium,
  subscription: u.subscription,
  progress: u.progress,
});
function cookie(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 864e5,
  });
}
router.post("/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim(),
      email = String(req.body.email || "")
        .trim()
        .toLowerCase(),
      password = String(req.body.password || "");
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
      return res
        .status(400)
        .json({
          message:
            "Use a valid name, email, and password of at least 8 characters.",
        });
    if (await User.exists({ email }))
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    cookie(res, user);
    res.status(201).json({ user: clean(user) });
  } catch (e) {
    res.status(500).json({ message: "Could not create account." });
  }
});
router.post("/login", async (req, res) => {
  const email = String(req.body.email || "")
      .trim()
      .toLowerCase(),
    password = String(req.body.password || "");
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "Incorrect email or password." });
  cookie(res, user);
  res.json({ user: clean(user) });
});
router.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.status(204).end();
});
router.get("/me", requireAuth, (req, res) =>
  res.json({ user: clean(req.user) }),
);
export default router;
