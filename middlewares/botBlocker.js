// middlewares/botBlocker.js

const botBlocker = (req, res, next) => {
  const userAgent = (req.get("User-Agent") || "").toLowerCase();

  const blockedPatterns = [
    "bot",
    "crawler",
    "spider",
    "curl",
    "wget",
    "python",
    "scrapy",
    "axios",
    "node-fetch",
    'GPTBot', 'OAI-SearchBot', 'Opera/9.95', 'Firefox/3.8'
  ];

  const isBot = blockedPatterns.some(pattern =>
    userAgent.includes(pattern)
  );

  if (isBot) {
    console.log(`[BLOCKED BOT]: ${userAgent}`);
    return res.status(403).send("Access Denied");
  }

  next();
};

module.exports = botBlocker;