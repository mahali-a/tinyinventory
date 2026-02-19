import { FastifyInstance, FastifyError } from "fastify";
import { AppError } from "../utils/errors";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | AppError, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: [],
        },
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.validation.map((v) => ({
            field: String(v.instancePath),
            message: v.message ?? "Invalid value",
          })),
        },
      });
    }

    app.log.error(error);
    reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: [],
      },
    });
  });
}
