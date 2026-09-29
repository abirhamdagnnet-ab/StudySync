import Joi from "joi";
import validate from "../middleware/validate.js";

const credentialsSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).required(),
}).required();

const validateCredentials = validate(credentialsSchema);

export { validateCredentials };