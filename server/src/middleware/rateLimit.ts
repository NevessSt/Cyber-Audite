import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
	message: {
		error: 'Too many login attempts, please try again later',
	},
});

export const aiLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		error: 'AI usage limit exceeded, please try again later',
	},
});
