// エラーハンドリング用

function requestErrorHandler(controller) {
  return async function (req, res, next) {
    try {
      return await controller(req, res);
    } catch (err) {
      console.log(err);
      if (res.headersSent) {
        next(err);
      }
      if (err.code === 11000 && err.keyValue.username) {
        // ユーザー名が重複
        return res
          .status(400)
          .json({ msg: "このユーザー名はすでに使われています" });
      }
      res.status(500).json({ msg: "不正なエラーが発生しました。", error: err });
    }
  };
}

export { requestErrorHandler };
