const { body, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  handleValidation,
];

const validateSubscription = [
  body("name").trim().notEmpty().withMessage("Subscription name is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Valid amount is required"),
  body("start_date").isDate().withMessage("Valid start_date (YYYY-MM-DD) is required"),
  body("next_renewal_date").isDate().withMessage("Valid next_renewal_date (YYYY-MM-DD) is required"),
  body("billing_cycle")
    .optional()
    .isIn(["monthly", "quarterly", "half-yearly", "yearly"])
    .withMessage("Invalid billing_cycle"),
  handleValidation,
];

module.exports = { validateRegister, validateSubscription };
