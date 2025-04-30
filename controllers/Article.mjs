import Article from "../models/Article.mjs";
import User from "../models/User.mjs";
import { validationResult } from "express-validator";
import { arxivIdFinder } from "../handlers/arxivIdFinder.mjs";

// Articleを作成しUserのArticlesにarXivIdを追加
export const postArticle = async (req, res) => {
  // エラーハンドル
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  // userIdを取得
  const userId = req.session.user.userId;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: "ユーザーが存在しません" });

  // arXivIdが正常なものか確認
  const papers = await arxivIdFinder(req.body.arXivId);
  if (papers.length !== 1) {
    return res.status(404).json({ msg: "無効なarXivIdです" });
  }
  papers[0].id = papers[0].id.split("/").pop();
  papers[0].id = papers[0].id.split("v")[0];
  const paper = papers[0];

  // その論文を追加済のとき
  if (user.articles.includes(req.body.arXivId)) {
    return res
      .status(403)
      .json({ msg: "あなたはすでにこの論文を追加しています" });
  }

  // ユーザーのarticlesにarXivIdを追加
  await user.updateOne({
    $push: {
      articles: req.body.arXivId,
    },
  });

  // articleを作成
  const newArticle = new Article({
    userId: userId,
    arXivId: req.body.arXivId,
  });

  const article = await newArticle.save();

  return res.status(200).json({ article, paper });
};

// 自分のArticleをすべて取得
export const getMyArticles = async (req, res) => {
  // userIdを取得
  const userId = req.session.user.userId;

  // userIdに合致するものをすべて取得
  const myArticles = await Article.find({
    userId: userId,
  }).sort({ updatedAt: -1 });

  // arXivIdのクエリを作成
  const ids = [];
  myArticles.map((article) => {
    const id = article.arXivId;
    ids.push(id);
  });
  const query = ids.map((id) => `${id}`).join("+OR+");
  const papers = await arxivIdFinder(query);

  // 長さが一致するかを比較
  if (papers.length !== myArticles.length) {
    return res.status(500).json({ msg: "不正なエラーが発生しました" });
  }

  const result = [];
  for (let i = 0; i < papers.length; i++) {
    result.push({ article: myArticles[i], paper: papers[i] });
  }

  return res.status(200).json(result);
};

// 特定のarXivIdのもの(isOpen)を取得
export const getArticlesFromArXiv = async (req, res) => {
  const arXivId = req.params.id;

  const articles = await Article.find({ arXivId, isOpen: true }).sort({
    updatedAt: -1,
  });

  const result = await Promise.all(
    articles.map(async (article) => {
      const user = await User.findById(article.userId);
      return {
        username: user.username,
        note: article.note,
      };
    })
  );

  res.status(200).json(result);
};

// 特定のuserIdのもの(isOpen)を取得
export const getArticlesFromUserId = async (req, res) => {
  const userId = req.params.id;

  // 一覧を取得
  const articles = await Article.find({ userId, isOpen: true }).sort({
    updatedAt: -1,
  });

  // arXivIdのクエリを作成
  const ids = [];
  articles.map((article) => {
    const id = article.arXivId;
    ids.push(id);
  });
  const query = ids.map((id) => `${id}`).join("+OR+");

  // 論文情報を取得
  const papers = await arxivIdFinder(query);

  // 長さが一致するかを比較
  if (papers.length !== articles.length) {
    return res.status(500).json({ msg: "不正なエラーが発生しました" });
  }

  const result = [];
  for (let i = 0; i < papers.length; i++) {
    result.push({ article: articles[i], paper: papers[i] });
  }

  res.status(200).json(result);
};

// 特定のArticleを取得
export const getOneArticle = async (req, res) => {
  // userIdを取得
  const userId = req.session.user.userId.toString();

  // idと一致するArticleを取得
  const article = await Article.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ msg: "論文情報が見つかりません" });
  }

  // 自分のものか確認
  if (article.userId.toString() !== userId) {
    return res
      .status(403)
      .json({ msg: "自身の保存した論文情報のみ確認できます" });
  }

  return res.status(200).json(article);
};

// 特定のArticleを削除しUserからも削除
export const deleteOneArticle = async (req, res) => {
  // userIdを取得
  const userId = req.session.user.userId.toString();
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: "ユーザーが存在しません" });

  // idと一致するArticleを取得
  const article = await Article.findById(req.params.id);
  if (!article) {
    return res.status(404).json({ msg: "論文情報が見つかりません" });
  }

  // 自分のものか確認
  if (article.userId.toString() !== userId) {
    return res
      .status(403)
      .json({ msg: "自身の保存した論文情報のみ削除できます" });
  }

  const arXivId = article.arXivId;

  // 論文が一覧にないとき
  if (!user.articles.includes(arXivId)) {
    return res.status(403).json({ msg: "あなたはこの論文を追加していません" });
  }

  // Userのarticlesから該当するarXivIdを削除
  await user.updateOne({
    $pull: {
      articles: arXivId,
    },
  });

  await article.deleteOne();

  return res.status(200).json({ msg: "論文情報が削除されました" });
};

// 特定のArticleにtagを追加
export const addTagToArticle = async (req, res) => {
  // エラーハンドル
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  // userIdを取得
  const userId = req.session.user.userId.toString();

  // idと一致するArticleを取得
  const article = await Article.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ msg: "論文情報が見つかりません" });
  }

  // 自分のものか確認
  if (article.userId.toString() !== userId) {
    return res
      .status(403)
      .json({ msg: "自身の保存した論文情報のみ変更できます" });
  }

  // タグの数が10を超えるならエラー
  if (article.tags.length >= 10) {
    return res.status(400).json({ msg: "登録できるタグは10個までです" });
  }

  // そのタグがすでに存在しないなら追加
  if (!article.tags.includes(req.body.tag)) {
    const updatedArticle = await article.updateOne({
      $push: {
        tags: req.body.tag,
      },
    });
    return res
      .status(200)
      .json({ msg: `${req.body.tag}タグが追加されました`, updatedArticle });
  } else {
    return res
      .status(403)
      .json({ msg: "あなたはすでにこのタグを追加しています" });
  }
};

// 特定のArticleにtagを削除
export const deleteTagToArticle = async (req, res) => {
  // エラーハンドル
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  // userIdを取得
  const userId = req.session.user.userId.toString();

  // idと一致するArticleを取得
  const article = await Article.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ msg: "論文情報が見つかりません" });
  }

  // 自分のものか確認
  if (article.userId.toString() !== userId) {
    return res
      .status(403)
      .json({ msg: "自身の保存した論文情報のみ変更できます" });
  }

  // そのタグがすでに存在するなら削除
  if (article.tags.includes(req.body.tag)) {
    const updatedArticle = await article.updateOne({
      $pull: {
        tags: req.body.tag,
      },
    });
    return res
      .status(200)
      .json({ msg: `${req.body.tag}タグが削除されました`, updatedArticle });
  } else {
    return res.status(403).json({ msg: "あなたはこのタグを追加していません" });
  }
};

// 特定のArtickleにNoteを更新、またはisOpenを更新
export const updateArticle = async (req, res) => {
  // エラーハンドル
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  // userIdを取得
  const userId = req.session.user.userId.toString();

  // idと一致するArticleを取得
  const article = await Article.findById(req.params.id);

  if (!article) {
    return res.status(404).json({ msg: "論文情報が見つかりません" });
  }

  // 自分のものか確認
  if (article.userId.toString() !== userId) {
    return res
      .status(403)
      .json({ msg: "自身の保存した論文情報のみ変更できます" });
  }

  // 情報を更新
  if (req.body.isOpen) await article.updateOne({ isOpen: req.body.isOpen });
  if (req.body.note) await article.updateOne({ note: req.body.note });

  return res.status(200).json({ msg: "情報が更新されました" });
};
