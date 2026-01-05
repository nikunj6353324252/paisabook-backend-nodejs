import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiError.js";

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "UNAUTHORIZED", "Request unauthorised.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return sendError(res, 401, "UNAUTHORIZED", "Invalid or expired token");
  }
};

export default requireAuth;
