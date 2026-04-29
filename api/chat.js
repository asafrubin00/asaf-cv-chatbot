const { createChatReply } = require("../lib/chat");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ reply: "POST only, please. I am fussy, but fair." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await createChatReply({
      message: body.message,
      history: body.history,
      sessionId: req.headers["x-session-id"],
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ reply: `Server error: ${err.message}` });
  }
};
