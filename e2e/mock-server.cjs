const http = require('http');
const url = require('url');

// Mock data
const mockUser = {
	id: 1,
	email: 'test@example.com',
	full_name: 'Test User',
	organization_id: 1,
	is_active: true,
	is_superuser: false
};

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true);
	const path = parsedUrl.pathname;
	const method = req.method;

	// Set CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// Handle preflight requests
	if (method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}

	// Set content type
	res.setHeader('Content-Type', 'application/json');

	try {
		// Authentication endpoints
		if (path === '/api/v1/users/me') {
			const authHeader = req.headers.authorization;
			if (authHeader === 'Bearer mock-session-token-12345') {
				res.writeHead(200);
				res.end(JSON.stringify(mockUser));
			} else {
				res.writeHead(401);
				res.end(JSON.stringify({ detail: 'Invalid token' }));
			}
			return;
		}

		if (path === '/api/v1/login/access-token') {
			res.writeHead(200);
			res.end(JSON.stringify({
				access_token: 'mock-session-token-12345',
				token_type: 'bearer'
			}));
			return;
		}

		// Organizations  
		if (path.startsWith('/api/v1/organization')) {
			res.writeHead(200);
			res.end(JSON.stringify([{
				id: 1,
				name: 'Test Organization'
			}]));
			return;
		}

		// Default 404 for unhandled routes
		res.writeHead(404);
		res.end(JSON.stringify({ detail: 'Not found' }));

	} catch (error) {
		console.error('Mock server error:', error);
		res.writeHead(500);
		res.end(JSON.stringify({ detail: 'Internal server error' }));
	}
});

const PORT = 8001;
server.listen(PORT, () => {
	console.log(`Mock backend server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
	console.log('Mock server shutting down...');
	server.close();
	process.exit(0);
});
