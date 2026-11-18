export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // PostgreSQL unique constraint violation
  if (err.code === "23505") {
    return res.status(409).json({
      message: "Dữ liệu đã tồn tại hoặc bị trùng lặp",
      detail: err.detail,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({
      message: "Dữ liệu liên quan không tồn tại hoặc đang được tham chiếu",
      detail: err.detail,
    });
  }

  console.error(`[Error] ${req.method} ${req.url}:`, err);
  res.status(500).json({
    message: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
  });
}
