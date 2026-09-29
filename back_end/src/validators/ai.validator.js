import Joi from "joi";
import validate from "../middleware/validate.js";

const idSchema = Joi.object({
  id: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const topicIdSchema = Joi.object({
  topicId: Joi.string().pattern(/^[1-9]\d*$/).required(),
}).required();

const conversationSchema = Joi.object({
  question: Joi.string().trim().min(1).max(1000).optional(),
  attachment_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^[1-9]\d*$/),
  ).optional(),
  topic_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^[1-9]\d*$/),
  ).optional(),
  title: Joi.string().trim().min(1).max(120).optional(),
}).or("question", "title", "attachment_id", "topic_id").required();

const uploadedConversationSchema = Joi.object({
  title: Joi.string().trim().max(120).optional(),
  topic_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^[1-9]\d*$/),
  ).optional(),
}).required();

const messageSchema = Joi.object({
  question: Joi.string().trim().min(1).max(1000).required(),
}).required();

const validateConversationId = validate(idSchema, "params");
const validateTopicId = validate(topicIdSchema, "params");
const validateConversation = validate(conversationSchema);
const validateUploadedConversation = validate(uploadedConversationSchema);
const validateMessage = validate(messageSchema);

export { validateConversationId, validateTopicId, validateConversation, validateUploadedConversation, validateMessage };
