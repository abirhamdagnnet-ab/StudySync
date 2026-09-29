import * as classService from "../services/class.service.js";
import { getClassTrends as fetchClassTrends } from "../services/classTrends.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const list = asyncHandler(async (request, response) => {
  const classes = await classService.listClasses(request.user);
  response.json({ success: true, data: { classes } });
});

const create = asyncHandler(async (request, response) => {
  const classroom = await classService.createClass(request.user, request.body);
  response.status(201).json({ success: true, data: { class: classroom } });
});

const listStudents = asyncHandler(async (request, response) => {
  const students = await classService.listStudents(request.user, request.params.id);
  response.json({ success: true, data: { students } });
});

const addStudent = asyncHandler(async (request, response) => {
  const enrollment = await classService.addStudent(request.user, request.params.id, request.body.email);
  response.status(201).json({ success: true, data: { enrollment } });
});

const removeStudent = asyncHandler(async (request, response) => {
  await classService.removeStudent(request.user, request.params.id, request.params.studentId);
  response.status(204).end();
});

const getTrends = asyncHandler(async (request, response) => {
  const topics = await fetchClassTrends(request.params.id, request.user);
  response.json({ success: true, data: { topics } });
});

export { list, create, listStudents, addStudent, removeStudent, getTrends };