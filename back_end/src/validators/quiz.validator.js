import Joi from "joi";
import validate from "../middleware/validate.js";

const sessionIdSchema = Joi.object({
  id: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const startSessionSchema = Joi.object({
  topic_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^[1-9]\d*$/),
  ).required(),
}).required();

const answerSchema = Joi.object({
  question_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^[1-9]\d*$/),
  ).required(),
  answer: Joi.any().required(),
}).required();

const validateSessionId = validate(sessionIdSchema, "params");
const validateStartSession = validate(startSessionSchema);
const validateAnswer = validate(answerSchema);

export { validateSessionId, validateStartSession, validateAnswer };