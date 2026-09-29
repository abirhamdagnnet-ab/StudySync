import * as adminService from "../services/admin.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const createUser = asyncHandler(async (request, response) => {
  const user = await adminService.createUser(request.body);
  response.status(201).json({ success: true, data: { user } });
});

const listUsers = asyncHandler(async (_request, response) => {
  const users = await adminService.listUsers();
  response.status(200).json({ success: true, data: { users } });
});

const getDashboardStats = asyncHandler(async (_request, response) => {
  const stats = await adminService.getDashboardStats();
  response.status(200).json({ success: true, data: { stats } });
});

const updateStatus = asyncHandler(async (request, response) => {
  const user = await adminService.updateStatus(request.params.id, request.body.is_active);
  response.status(200).json({ success: true, data: { user } });
});

export { createUser, listUsers, updateStatus, getDashboardStats };