import * as authService from "../services/auth.service.js";
import { findById } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

const register = asyncHandler(async (request, response) => {
  const result = await authService.register(request.body);
  response.status(201).json({ success: true, data: result });
});

const login = asyncHandler(async (request, response) => {
  const result = await authService.login(request.body);
  response.status(200).json({ success: true, data: result });
});

const me = asyncHandler(async (request, response) => {
  const user = await findById(request.user.id);
  response.status(200).json({ success: true, data: { user } });
});

export { register, login, me };