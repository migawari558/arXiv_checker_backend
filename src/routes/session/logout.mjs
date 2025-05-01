import { Router } from "express";
const router = Router();

router.delete("/", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: "セッションの削除に失敗しました" });
    }
    res.clearCookie("session");
    res.status(200).send("ログアウトに成功しました");
  });
});

export default router;
