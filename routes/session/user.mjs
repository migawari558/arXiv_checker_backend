import { Router } from "express";
import { requestErrorHandler } from "../../handlers/ErrorHandler.mjs";
import {
  getMyData,
  deleteMyData,
  updateMyData,
  getUser,
} from "../../controllers/User.mjs";
import { body } from "express-validator";
import arxivAllCategories from "../../data/arXivCategories.mjs";
const router = Router();

// 自身のユーザの情報を取得
router.get("/me", requestErrorHandler(getMyData));

// 自身のユーザ情報を削除
router.delete(
  "/me",
  body("password")
    .notEmpty()
    .isString()
    .withMessage("パスワードを入力してください"),
  requestErrorHandler(deleteMyData)
);

// 自身のユーザー情報を更新
router.put(
  "/me",
  body("username")
    .optional()
    .notEmpty()
    .isString()
    .withMessage("ユーザー名を入力してください")
    .isLength({ min: 3, max: 25 })
    .withMessage("ユーザー名は3~25文字である必要があります"),
  body("categories")
    .optional()
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
  body("password")
    .notEmpty()
    .isString()
    .withMessage("現在のパスワードを入力してください"),
  body("newpassword")
    .optional()
    .notEmpty()
    .isString()
    .withMessage("パスワードを入力してください")
    .isLength({ min: 10, max: 40 })
    .withMessage("パスワードは10~40文字である必要があります")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage("パスワードには大文字・小文字・数字をすべて含めてください"),

  requestErrorHandler(updateMyData)
);

// 特定のidの人の情報を取得
router.get("/:id", requestErrorHandler(getUser));

export default router;
