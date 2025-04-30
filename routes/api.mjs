import { sessionHandler } from "../handlers/SessionHandler.mjs";
import authRouter from "./auth/auth.mjs";
import { Router } from "express";
import sessionRouter from "./session/session.mjs";
const router = Router();

// ログイン、登録などのセッションがない状態でも行けるところ
router.use("/auth", authRouter);

// その他、セッションがないと行けないところ
router.use("/session", sessionHandler, sessionRouter);

export default router;
