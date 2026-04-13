import type { ValidationSchema } from "../../../shared/middlewares/validate";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalidEmailMessage(value: unknown): string | undefined {
  if (typeof value !== "string" || !EMAIL_PATTERN.test(value)) {
    return "invalid email format";
  }
  return undefined;
}

export const registerBodySchema: ValidationSchema = {
  name: { required: true, minLength: 1 },
  email: {
    required: true,
    custom: (value) => invalidEmailMessage(value),
  },
  password: { required: true },
};

export const loginBodySchema: ValidationSchema = {
  email: {
    required: true,
    custom: (value) => invalidEmailMessage(value),
  },
  password: { required: true },
};
