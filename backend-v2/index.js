require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");

const routes  = require("./src/routes");
const { errorHandler, notFound } = require("./src/middleware/error");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(morgan("dev"));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── Catch-all ───────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  const adapter = process.env.DB_ADAPTER || "mock";
  console.log(`\n🔗 ChainOps API  →  http://localhost:${PORT}`);
  console.log(`   Adapter: ${adapter}\n`);
});

module.exports = app;
