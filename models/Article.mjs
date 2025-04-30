import mongoose from "mongoose";
import { model } from "mongoose";

const ArticleSchema = new mongoose.Schema(
  {
    arXivId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      default: "",
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Article = model("article", ArticleSchema);
export default Article;
