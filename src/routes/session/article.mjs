import { Router } from "express";
import { body } from "express-validator";
import { requestErrorHandler } from "../../handlers/ErrorHandler.mjs";
import {
  addTagToArticle,
  deleteOneArticle,
  deleteTagToArticle,
  getArticlesFromArXiv,
  getArticlesFromUserId,
  getMyArticles,
  getOneArticle,
  postArticle,
  updateArticle,
} from "../../controllers/Article.mjs";
const router = Router();

// 論文情報を追加
router.post(
  "/",
  body("arXivId")
    .notEmpty()
    .isString()
    .withMessage("arXivIdを入力してください"),
  requestErrorHandler(postArticle)
);

// 自身の論文情報の一覧を取得
router.get("/", requestErrorHandler(getMyArticles));

// 特定の論文のノート一覧を取得
router.get("/arXiv/:id", requestErrorHandler(getArticlesFromArXiv));

// 特定のuserのarticlesを取得
router.get("/user/:id", requestErrorHandler(getArticlesFromUserId));

// 自身の特定の論文情報を取得
router.get("/:id", requestErrorHandler(getOneArticle));

// note, isOpenを更新
router.put(
  "/:id",
  body("note").optional().isString(),
  body("isOpen").optional().isBoolean(),
  requestErrorHandler(updateArticle)
);

// 自身の特定の論文情報を削除
router.delete("/:id", requestErrorHandler(deleteOneArticle));

// タグを追加
router.put(
  "/:id/tag/add",
  body("tag")
    .notEmpty()
    .isString()
    .withMessage("タグ名を入力してください")
    .isLength({ min: 1, max: 20 })
    .withMessage("タグ名は20文字までで入力してください"),
  requestErrorHandler(addTagToArticle)
);

// タグを削除
router.put(
  "/:id/tag/delete",
  body("tag")
    .notEmpty()
    .isString()
    .withMessage("タグ名を入力してください")
    .isLength({ min: 1, max: 20 })
    .withMessage("タグ名は20文字までで入力してください"),
  requestErrorHandler(deleteTagToArticle)
);

export default router;
