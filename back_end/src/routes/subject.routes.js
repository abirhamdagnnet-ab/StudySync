import express from "express";
import * as subjectController from "../controllers/subject.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import { validateId, validateSubject } from "../validators/content.validator.js";

const router = express.Router();

router.use(authenticate);
router.get("/", subjectController.list);
router.get("/:id", validateId, subjectController.get);
router.post("/", authorize("teacher", "admin"), validateSubject, subjectController.create);
router.put("/:id", authorize("admin"), validateId, validateSubject, subjectController.update);
router.delete("/:id", authorize("admin"), validateId, subjectController.remove);

export default router;