import { generateAccessToken, generateRefreshToken, verifyToken } from '../src/utils/token';

describe('token utils', () => {
	const secret = '0123456789abcdef0123456789abcdef';
	const payload = { userId: 'user-1', role: 'ADMIN' };

	beforeAll(() => {
		process.env.JWT_SECRET = secret;
	});

	test('generates a valid access token that can be verified', () => {
		const token = generateAccessToken(payload);
		expect(typeof token).toBe('string');
		const decoded = verifyToken(token);
		expect(decoded.userId).toBe(payload.userId);
		expect(decoded.role).toBe(payload.role);
	});

	test('generates a valid refresh token that can be verified', () => {
		const token = generateRefreshToken(payload);
		expect(typeof token).toBe('string');
		const decoded = verifyToken(token);
		expect(decoded.userId).toBe(payload.userId);
		expect(decoded.role).toBe(payload.role);
	});

	test('throws when JWT_SECRET is missing', () => {
		delete process.env.JWT_SECRET;
		expect(() => generateAccessToken(payload)).toThrow('JWT_SECRET is not defined');
		process.env.JWT_SECRET = secret;
	});
});

