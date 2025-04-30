import { Router } from "express";
import userRouter from "./user.mjs";
import logoutRouter from "./logout.mjs";
import articleRouter from "./article.mjs";
import arXivRouter from "./arxiv.mjs";
const router = Router();

// ユーザー関連の処理
router.use("/user", userRouter);

// ログアウト処理
router.use("/logout", logoutRouter);

// 保存した論文関連の処理
router.use("/article", articleRouter);

// arXiv-api関連
router.use("/arXiv", arXivRouter);

export default router;
