export const sessionHandler = (req, res, next) => {
  if (req.session.user) {
    req.session.touch();
    next();
  } else {
    res.status(401).json({ msg: "セッションの有効期限が切れています" });
  }
};
