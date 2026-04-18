process.env.NODE_ENV = 'test';
process.env.API_PORT = '4000';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-1234';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-1234';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';
process.env.CORS_ORIGIN = '*';
