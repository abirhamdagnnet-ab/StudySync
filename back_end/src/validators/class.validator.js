import Joi from "joi";
import validate from "../middleware/validate.js";

const classIdSchema = Joi.object({
  id: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const studentIdSchema = Joi.object({
  id: Joi.string().pattern(/^[1-9]\d*$/).required(),
  studentId: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const createClassSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  subject_id: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const addStudentSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
}).required();

const validateClassId = validate(classIdSchema, "params");
const validateStudentId = validate(studentIdSchema, "params");
const validateCreateClass = validate(createClassSchema);
const validateAddStudent = validate(addStudentSchema);

export { validateClassId, validateStudentId, validateCreateClass, validateAddStudent };