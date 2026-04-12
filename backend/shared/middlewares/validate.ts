import type { NextFunction, Request, Response } from "express";

type FieldRules = {
  required?: boolean;
  minLength?: number;
  custom?: (
    value: unknown,
    body: Record<string, unknown>,
  ) => string | null | undefined;
};

export type ValidationSchema = Record<string, FieldRules>;

/**
 * Validates `req.body` keys against simple per-field rules.
 * On failure responds with `{ error: "validation failed", fields }`.
 */
const validate =
  (schema: ValidationSchema | null | undefined) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!schema) {
      next();
      return;
    }

    const fields: Record<string, string> = {};
    const body = (req.body ?? {}) as Record<string, unknown>;

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      if (
        rules.required &&
        (value === undefined || value === null || value === "")
      ) {
        fields[field] = "is required";
        continue;
      }

      const parts: string[] = [];

      if (
        rules.minLength != null &&
        typeof value === "string" &&
        value.length < rules.minLength
      ) {
        parts.push(`must be at least ${rules.minLength} characters`);
      }

      if (rules.custom) {
        const customErr = rules.custom(value, body);
        if (customErr) parts.push(customErr);
      }

      if (parts.length > 0) {
        fields[field] = parts.join("; ");
      }
    }

    if (Object.keys(fields).length > 0) {
      res.status(400).json({
        error: "validation failed",
        fields,
      });
      return;
    }

    next();
  };

export default validate;
