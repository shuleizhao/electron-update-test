const { createServer } = require("http");
const { parse } = require("url");
const hazel = require("hazel-server");

const server = createServer((req, res) => {
  const { pathname } = parse(req.url);
  const hazelHandler = hazel({
    account: "shuleizhao",
    repository: "electron-update-test",
    token: process.env.GITHUB_TOKEN,
    cors: true,
    cache: false,
    url: process.env.VERCEL_URL || "http://localhost:3001",
    private: true,
  });

  try {
    hazelHandler(req, res, pathname);
  } catch (error) {
    console.error("Hazel error:", error);
    res.statusCode = 500;
    res.end(
      JSON.stringify({ error: "Internal Server Error", message: error.message })
    );
  }
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

server.listen(3001, () => {
  console.log("Hazel server is running on port 3001");
  console.log(
    `GitHub Token: ${
      process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN + "..." : "not set"
    }`
  );
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
