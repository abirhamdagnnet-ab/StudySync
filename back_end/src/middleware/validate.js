import ApiError from "../utils/ApiError.js";

const validate = (schema, property = "body") => {
  if (!schema || typeof schema.validate !== "function") {
    throw new TypeError("validate requires a Joi schema");
  }

  if (!["body", "params", "query"].includes(property)) {
    throw new TypeError('Validation property must be "body", "params", or "query"');
  }

  return (request, _response, next) => {
    const { error, value } = schema.validate(request[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join("; ");
      return next(new ApiError(400, message));
    }

    if (property === "query") {
      Object.defineProperty(request, "query", {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    } else {
      request[property] = value;
    }

    next();
  };
};

export default validate;