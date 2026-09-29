import bcrypt from "bcrypt";
import ApiError from "../utils/ApiError.js";
import * as userModel from "../models/user.model.js";
import * as adminDashboardModel from "../models/adminDashboard.model.js";

const createUser = async ({ email, password, role }) => {
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    return await userModel.createManagedUser({
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    });
  } catch (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "An account with this email already exists");
    }
    throw error;
  }
};

const listUsers = () => userModel.listUsers();
const getDashboardStats = () => adminDashboardModel.getStats();

const updateStatus = async (id, isActive) => {
  const user = await userModel.setActiveStatus(id, isActive);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export { createUser, listUsers, updateStatus, getDashboardStats };