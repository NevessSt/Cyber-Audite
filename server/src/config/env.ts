import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
	'DATABASE_URL',
	'JWT_SECRET',
	'PORT',
	'CLIENT_URL'
];

export const validateEnv = () => {
	const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

	if (missingVars.length > 0) {
		console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
		process.exit(1);
	}

	// Strict check for JWT_SECRET length
	if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
		console.error('JWT_SECRET must be at least 32 characters long for security.');
		process.exit(1);
	}

	const port = Number(process.env.PORT);
	if (!Number.isInteger(port) || port <= 0) {
		console.error('PORT must be a positive integer.');
		process.exit(1);
	}

	if (process.env.NODE_ENV && !['development', 'test', 'production'].includes(process.env.NODE_ENV)) {
		console.error('NODE_ENV must be one of development, test, production when set.');
		process.exit(1);
	}
};
