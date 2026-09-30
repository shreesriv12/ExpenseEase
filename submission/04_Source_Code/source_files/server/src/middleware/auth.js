import jwt from "jsonwebtoken";
export function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    next();
  } catch {
    return res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
}
