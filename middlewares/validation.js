const { body, validationResult } = require("express-validator");

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message:  "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

exports.validationWhyChooseITS = [
    body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 character'),
    body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 character'),
]