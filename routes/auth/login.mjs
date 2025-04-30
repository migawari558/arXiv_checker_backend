import { Router } from "express";
import { loginUser } from "../../controllers/Login.mjs";
import { body } from "express-validator";
import { requestErrorHandler } from "../../handlers/ErrorHandler.mjs";
const router = Router();

router.post(
  "/",
  body("username")
    .notEmpty()
    .isString()
    .withMessage("ユーザー名を入力してください"),
  body("password")
    .notEmpty()
    .isString()
    .withMessage("パスワードを入力してください"),
  requestErrorHandler(loginUser)
);

export default router;
