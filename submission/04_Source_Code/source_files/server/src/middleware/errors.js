export function errors(err, req, res, _next) {
  if (err.name === "ZodError") {
    const issue = err.issues?.[0];
    const field = issue?.path?.join(".");
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: issue
          ? field
            ? `${field}: ${issue.message}`
            : issue.message
          : "Invalid request",
      },
    });
  }
  if (err.status && err.status < 500)
    return res.status(err.status).json({
      error: { code: err.code || "VALIDATION_ERROR", message: err.message },
    });
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}
