import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import ApiError from "../utils/ApiError.js";

const maxFileSize = 10 * 1024 * 1024;
const storageDirectory = path.resolve(process.cwd(), "storage", "ai-attachments");
const allowedTypes = new Map([
  [".pdf", "application/pdf"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".txt", "text/plain"],
]);

const diskStorage = multer.diskStorage({
  destination: async (_request, _file, callback) => {
    try {
      await fs.mkdir(storageDirectory, { recursive: true });
      callback(null, storageDirectory);
    } catch (error) {
      callback(error);
    }
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const multerUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: maxFileSize,
    files: 1,
    fields: 3,
    parts: 4,
    fieldSize: 4096,
    fieldNameSize: 100,
  },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.get(extension) !== file.mimetype) {
      return callback(new ApiError(415, "Only PDF, DOCX, and TXT files are allowed"));
    }
    callback(null, true);
  },
});

const uploadAttachment = (request, response, next) => {
  multerUpload.single("file")(request, response, (error) => {
    if (!error) {
      if (!request.file) return next(new ApiError(400, "A file is required"));
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(413, "File size must not exceed 10 MB"));
    }
    if (error instanceof multer.MulterError) {
      return next(new ApiError(400, "The uploaded file could not be accepted"));
    }
    next(error);
  });
};

const removeUploadedFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

const cleanupUploadedFileOnError = (error, request, _response, next) => {
  removeUploadedFile(request.file?.path)
    .catch((cleanupError) => console.error("Failed to remove rejected upload", cleanupError))
    .finally(() => next(error));
};

export { uploadAttachment, removeUploadedFile, cleanupUploadedFileOnError, storageDirectory };
