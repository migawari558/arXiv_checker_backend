import express from "express";
import env from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import apiRoute from "./src/routes/api.mjs";
import MongoDBStoreFacroty from "connect-mongodb-session";
import cors from "cors";
const app = express();
env.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "https://arxiv-checker-frontend.vercel.app/",
    credentials: true,
  })
);

// セッション管理
const MongoDBStore = MongoDBStoreFacroty(session);
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});
app.use(
  session({
    name: "session",
    secret: process.env.SESS_SECRET,
    resave: true,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 10, // 10時間の期限
      sameSite: "none", // クロスドメインでは "none"
      secure: true,
      httpOnly: true,
    },
  })
);

// データベースに接続
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DBと接続中");
  })
  .catch((err) => {
    console.log(err);
  });

const db = mongoose.connection;

db.once("error", function (err) {
  console.error("connection error: ", err);
});

db.once("open", function () {
  console.log("Connected successfully");
});

// ミドルウェア
app.use("/api", apiRoute);

// サーバ起動
const server = app.listen(process.env.PORT, () => {
  console.log("🚀 app started. port:" + server.address().port);
});
