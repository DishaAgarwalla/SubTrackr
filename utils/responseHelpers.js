/**
 * Standard API response helpers
 */

const success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const error = (res, message = "Something went wrong", statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

const paginate = (res, data, total, page, limit) => {
  return res.json({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, error, paginate };
