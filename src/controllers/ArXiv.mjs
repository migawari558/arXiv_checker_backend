import { validationResult } from "express-validator";
import User from "../models/User.mjs";
import {
  arxivIdFinder,
  arxivQueryFinder,
  arxivTimeline,
} from "../handlers/arxivIdFinder.mjs";

// 最後のログイン以降を全取得
export const getArxiv = async (req, res) => {
  // userIdを取得
  const userId = req.session.user.userId;

  // 時刻とカテゴリと登録済み論文の一覧を取得
  const query = await User.findById(userId);

  const papers = await arxivTimeline(query);

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

  const papers = await arxivQueryFinder(req.body);

  papers?.map((paper) => {
    paper.id = paper.id.split("/").pop();
    paper.id = paper.id.split("v")[0];
  });

  res.status(200).json(papers);
};
