import { Router } from "express";
import signupRoutes from "./signup.mjs";
import loginRoutes from "./login.mjs";
const router = Router();

// 登録用ルート
router.use("/signup", signupRoutes);

// ログイン用ルート
router.use("/login", loginRoutes);

export default router;
