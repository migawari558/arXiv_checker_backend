import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { model } from "mongoose";
import arxivAllCategories from "../data/arXivCategories.mjs";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 3,
      max: 25,
      unique: true,
    },
    password: {
      // ハッシュ化して保存
      type: String,
      required: true,
      select: false,
    },
    articles: {
      // 保存した論文のarXiv id
      type: [String],
      default: [],
    },
    categories: [
      {
        // 研究分野
        type: String,
        enum: arxivAllCategories,
      },
    ],
    lastLogin: {
      type: Date,
      default: () => new Date(0),
    },
    thisLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// パスワードのハッシュ化、72文字までしか受付ない
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = model("User", UserSchema);
export default User;
