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
  const message = err.message || "Unexpected error";
  const status = err.status || 400;
  res
    .status(status)
    .json({ error: { code: err.code || "VALIDATION_ERROR", message } });
}
