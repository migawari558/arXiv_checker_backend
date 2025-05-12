import { validationResult } from "express-validator";
import User from "../models/User.mjs";
import bcrypt from "bcrypt";
import env from "dotenv";
env.config();

// ログイン
export async function loginUser(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  // username でログイン
  const user = await User.findOne({ username: req.body.username }).select(
    "+password"
  );
  if (!user) return res.status(404).json({ msg: "ユーザーが存在しません" });

  // password を照合
  const isCorrectPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isCorrectPassword)
    return res.status(400).json({ msg: "パスワードが違います" });

  // lastLoginを更新
  user.lastLogin = user.thisLogin;
  user.thisLogin = new Date();
  const returnUser = await user.save();

  // password は返却しない
  const { password, ...userContent } = returnUser.toObject();

  // セッションを保存
  req.session.user = {
    userId: userContent._id,
    username: userContent.username,
  };

  return res.status(200).json(userContent);
}
