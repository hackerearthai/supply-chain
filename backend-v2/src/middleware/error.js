function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
}

function notFound(req, res) {
  res.status(404).json({ error: `${req.method} ${req.originalUrl} not found` });
}

module.exports = { errorHandler, notFound };
