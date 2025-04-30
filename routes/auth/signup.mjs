import { Router } from "express";
import { body } from "express-validator";
import { requestErrorHandler } from "../../handlers/ErrorHandler.mjs";
import { registUser } from "../../controllers/Signup.mjs";
import arxivAllCategories from "../../data/arXivCategories.mjs";

const router = Router();

// ユーザー登録
router.post(
  "/",
  body("username")
    .notEmpty()
    .withMessage("ユーザー名を入力してください")
    .isString()
    .isLength({ min: 3, max: 25 })
    .withMessage("ユーザー名は3~25文字である必要があります"),
  body("password")
    .notEmpty()
    .withMessage("パスワードを入力してください")
    .isString()
    .isLength({ min: 10, max: 40 })
    .withMessage("パスワードは10~40文字である必要があります")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage("パスワードには大文字・小文字・数字をすべて含めてください"),
  body("categories")
    .notEmpty()
    .withMessage("カテゴリ名を指定してください")
    .custom((categories) => {
      const allowedCategories = arxivAllCategories;
      for (const category of categories) {
        if (!allowedCategories.includes(category)) {
          throw new Error(`${category}は無効なタグ名です`);
        }
      }
      return true;
    }),
  requestErrorHandler(registUser)
);

export default router;
