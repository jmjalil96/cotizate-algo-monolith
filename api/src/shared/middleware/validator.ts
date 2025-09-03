import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodSchema } from "zod";

interface ValidationSchemas {
	body?: ZodSchema;
	query?: ZodSchema;
	params?: ZodSchema;
}

/**
 * Validation middleware that uses Zod schemas to validate request data.
 *
 * @param schemas - Object containing optional Zod schemas for body, query, and params
 * @returns Express middleware that validates request data
 *
 * @example
 * ```typescript
 * // Schemas should use .strip() by default (removes unknown fields)
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * }); // Implicitly strips unknown fields
 *
 * // Use .strict() when you want to reject unknown fields
 * const strictSchema = z.object({
 *   id: z.string()
 * }).strict();
 *
 * // Query/params: use z.coerce for type conversion
 * const paginationSchema = z.object({
 *   page: z.coerce.number().default(1),
 *   limit: z.coerce.number().default(20)
 * });
 *
 * app.post('/users',
 *   validate({ body: userSchema, query: paginationSchema }),
 *   (req, res) => {
 *     const { body, query } = res.locals.validated;
 *   }
 * );
 * ```
 */
export const validate = (schemas: ValidationSchemas): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction) => {
		// Always initialize validated object
		res.locals.validated = {};

		try {
			// Validate body if schema provided
			if (schemas.body) {
				res.locals.validated.body = schemas.body.parse(req.body);
			}

			// Validate query if schema provided
			if (schemas.query) {
				res.locals.validated.query = schemas.query.parse(req.query);
			}

			// Validate params if schema provided
			if (schemas.params) {
				res.locals.validated.params = schemas.params.parse(req.params);
			}

			next();
		} catch (error) {
			// Pass error directly to errorHandler
			// ZodError will be handled there with proper logging and detail exposure
			next(error);
		}
	};
};
