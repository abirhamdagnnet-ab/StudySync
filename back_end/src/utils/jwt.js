import jsonwebtoken from "jsonwebtoken";
import env from "../config/env.js";

const sign = (payload, options = {}) => jsonwebtoken.sign(payload, env.JWT_SECRET, options);
const verify = (token, options = {}) => jsonwebtoken.verify(token, env.JWT_SECRET, options);

export { sign, verify };