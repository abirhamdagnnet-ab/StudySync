import * as subjectService from "../services/subject.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const list = asyncHandler(async (_request, response) => {
  response.json({ success: true, data: { subjects: await subjectService.listSubjects() } });
});

const get = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { subject: await subjectService.getSubject(request.params.id) } });
});

const create = asyncHandler(async (request, response) => {
  const subject = await subjectService.createSubject(request.body);
  response.status(201).json({ success: true, data: { subject } });
});

const update = asyncHandler(async (request, response) => {
  const subject = await subjectService.updateSubject(request.params.id, request.body);
  response.json({ success: true, data: { subject } });
});

const remove = asyncHandler(async (request, response) => {
  await subjectService.deleteSubject(request.params.id);
  response.status(204).end();
});

export { list, get, create, update, remove };