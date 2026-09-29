import { isDeepStrictEqual } from "node:util";
import Joi from "joi";
import validate from "../middleware/validate.js";

const idSchema = Joi.object({
  id: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const subjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().allow("", null).optional(),
}).required();

const topicSchema = Joi.object({
  subject_id: Joi.string().pattern(/^[1-9]\d*$/).required(),
  name: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().allow("", null).optional(),
}).required();

const questionSchema = Joi.object({
  topic_id: Joi.string().pattern(/^[1-9]\d*$/).required(),
  prompt: Joi.string().trim().min(1).max(5000).required(),
  options: Joi.array().items(Joi.any()).min(2).max(6).required(),
  correct_answer: Joi.any().invalid(null).required(),
  difficulty: Joi.number().integer().min(1).max(3).required(),
  explanation: Joi.string().trim().min(1).max(10000).required(),
}).custom((question, helpers) => {
  if (!question.options.some((option) => isDeepStrictEqual(option, question.correct_answer))) {
    return helpers.error("any.invalid");
  }
  return question;
}).messages({ "any.invalid": '"correct_answer" must be one of "options"' }).required();

const topicListQuerySchema = Joi.object({
  subject_id: Joi.string().pattern(/^[1-9]\d*$/).optional(),
}).required();

const questionListQuerySchema = Joi.object({
  difficulty: Joi.number().integer().min(1).max(3).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).required();

const validateId = validate(idSchema, "params");
const validateSubject = validate(subjectSchema);
const validateTopic = validate(topicSchema);
const validateTopicListQuery = validate(topicListQuerySchema, "query");
const validateQuestion = validate(questionSchema);
const validateQuestionListQuery = validate(questionListQuerySchema, "query");

export {
  validateId,
  validateSubject,
  validateTopic,
  validateTopicListQuery,
  validateQuestion,
  validateQuestionListQuery,
};