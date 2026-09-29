import bcrypt from "bcrypt";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import { sign } from "../utils/jwt.js";
import * as userModel from "../models/user.model.js";

const invalidCredentialsMessage = "Invalid email or password";
const saltRounds = 12;

const createAuthResponse = (user) => ({
  user,
  token: sign({ sub: String(user.id) }, { expiresIn: env.JWT_EXPIRES_IN }),
  expiresIn: env.JWT_EXPIRES_IN,
});

const register = async ({ email, password }) => {
  const passwordHash = await bcrypt.hash(password, saltRounds);

  try {
    const user = await userModel.create({
      email: email.trim().toLowerCase(),
      passwordHash,
    });
    return createAuthResponse(user);
  } catch (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "An account with this email already exists");
    }
    throw error;
  }
};

const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email.trim().toLowerCase());
  const passwordMatches = user?.password_hash
    ? await bcrypt.compare(password, user.password_hash)
    : false;

  if (!user || !user.is_active || !passwordMatches) {
    throw new ApiError(401, invalidCredentialsMessage);
  }

  const { password_hash: _passwordHash, ...publicUser } = user;
  return createAuthResponse(publicUser);
};

export { register, login };