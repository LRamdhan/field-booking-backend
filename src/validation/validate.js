import ValidationError from "./../exception/ValidationError.js";

const validate = (schema, data) => {
  const result = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false
  });
  if(result.error) {
    throw new ValidationError(result.error.message);
  } else {
    return result.value;
  }
};

export default validate