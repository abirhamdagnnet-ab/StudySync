import Joi from "joi";
import validate from "../middleware/validate.js";

const createUserSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("teacher", "admin").required(),
}).required();

const updateStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
}).required();

const userIdParamsSchema = Joi.object({
  id: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const validateCreateUser = validate(createUserSchema);
const validateUpdateStatus = validate(updateStatusSchema);
const validateUserId = validate(userIdParamsSchema, "params");

export { validateCreateUser, validateUpdateStatus, validateUserId };