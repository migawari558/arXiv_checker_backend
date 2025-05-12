import { Router } from "express";
import { requestErrorHandler } from "../../handlers/ErrorHandler.mjs";
import {
  getArxiv,
  getArxivFromId,
  searchArxiv,
} from "../../controllers/ArXiv.mjs";
import arxivAllCategories from "../../data/arXivCategories.mjs";
import { body } from "express-validator";
const router = Router();

router.get("/", requestErrorHandler(getArxiv));

router.post(
  "/search",
  body("title").isString(),
  body("author").isString(),
  body("abstruct").isString(),
  body("freeWord").isString(),
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
  requestErrorHandler(searchArxiv)
);

router.get("/:id", requestErrorHandler(getArxivFromId));

export default router;
