import { validationResult } from "express-validator";
import User from "../models/User.mjs";

// ユーザ登録用
export const registUser = async (req, res) => {
  // エラー検出
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = errors.array();
    return res.status(400).json(err);
  }

  // ユーザ登録
  const newUser = new User(req.body);
  newUser.thisLogin = new Date();
  const user = await newUser.save();
  const { password, ...returnUser } = user._doc;

  // セッションを保存
  const sessUser = { userId: user._id, username: user.username };
  req.session.user = sessUser;

  return res.status(200).json(returnUser);
};
