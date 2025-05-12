import User from "../models/User.mjs";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import Article from "../models/Article.mjs";

// 自分の情報を取得
export const getMyData = async (req, res) => {
  // セッションからユーザIdを取得
  const userId = req.session.user.userId;
  const user = await User.findById(userId);

  if (!user) return res.status(404).json({ msg: "ユーザーが存在しません" });

  res.status(200).json(user);
};

// 自分の情報を削除
export const deleteMyData = async (req, res) => {
  // エラーハンドル
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  // セッションからユーザIdを取得
  const userId = req.session.user.userId;
  const user = await User.findById(userId).select("+password");

  if (!user) return res.status(404).json({ msg: "ユーザーが存在しません" });

  // password照合
  const isCorrectPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isCorrectPassword)
    return res.status(400).json({ msg: "パスワードが違います" });

  await user.deleteOne();

  // ユーザーの作成したArticleの削除
  await Article.deleteMany({ userId });

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: "セッションの削除に失敗しました" });
    }
    res.clearCookie("session");
    res.status(200).json({ msg: "ユーザーが削除されました" });
  });
};

// 自分の情報を更新
export const updateMyData = async (req, res) => {
  // エラーハンドル
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  const { username, categories, newpassword } = req.body;

  // セッションからuserを取得
  const userId = req.session.user.userId;
  const user = await User.findById(userId).select("+password");

  if (!user) return res.status(404).json({ msg: "ユーザーが存在しません" });

  // password更新がある場合のみ
  if (newpassword) {
    // password照合
    const isCorrectPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isCorrectPassword)
      return res.status(400).json({ msg: "パスワードが違います" });
  }

  // 存在するデータのみ更新
  if (username) user.username = username;
  if (categories) user.categories = categories;
  if (newpassword) user.password = newpassword;

  const updatedUser = await user.save();

  // pass以外を返却
  const { password, ...updatedUserWithoutPass } = updatedUser._doc;
  res.status(200).json(updatedUserWithoutPass);
};

// 指定したuserの情報を取得
export const getUser = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  if (!user) return res.status(404).json({ msg: "ユーザーが見つかりません" });

  res.status(200).json(user);
};
