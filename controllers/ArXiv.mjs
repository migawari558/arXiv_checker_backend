import arxiv from "arxiv-api";
import { validationResult } from "express-validator";
import User from "../models/User.mjs";
import { arxivIdFinder } from "../handlers/arxivIdFinder.mjs";

// 最後のログイン以降を全取得
export const getArxiv = async (req, res) => {
  // userIdを取得
  const userId = req.session.user.userId;

  // 時刻とカテゴリを取得
  const { categories, lastLogin, thisLogin } = await User.findById(userId);
  const date = `submittedDate:[${lastLogin
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")} TO ${thisLogin
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}]`;

  // lastLoginからthisLoginまでのcategoriesの論文を取得
  const papers = await arxiv.search({
    searchQueryParams: [
      {
        include: [
          {
            name:
              categories.map((cat) => `${cat}`).join(" OR cat:") +
              " AND " +
              date,
            prefix: "cat",
          },
        ],
      },
    ],
    start: 0,
    maxResults: 50,
    sortBy: "submittedDate",
    sortOrder: "descending",
  });
  papers.map((paper) => {
    paper.id = paper.id.split("/").pop();
    paper.id = paper.id.split("v")[0];
  });

  return res.status(200).json(papers);
};

export const getArxivFromId = async (req, res) => {
  const id = req.params.id;
  const paper = await arxivIdFinder(id);

  if (paper.length !== 1) {
    return res.status(404).json({ msg: "無効なidです" });
  }

  paper[0].id = paper[0].id.split("/").pop();
  paper[0].id = paper[0].id.split("v")[0];

  return res.status(200).json(paper[0]);
};

export const searchArxiv = async (req, res) => {
  // エラーハンドル
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  const { title, author, abstract, categories, freeWord } = req.body;

  const query = [];
  if (title) query.push({ name: title, prefix: "ti" });
  if (author) query.push({ name: author, prefix: "au" });
  if (abstract) query.push({ name: abstract, prefix: "abs" });
  if (freeWord) query.push({ name: freeWord, prefix: "all" });
  if (categories.length > 0)
    query.push({
      name: categories.map((cat) => `${cat}`).join(" OR cat:"),
      prefix: "cat",
    });

  const papers = await arxiv.search({
    searchQueryParams: [
      {
        include: query,
      },
    ],
  });
  papers.map((paper) => {
    paper.id = paper.id.split("/").pop();
    paper.id = paper.id.split("v")[0];
  });

  res.status(200).json(papers);
};
