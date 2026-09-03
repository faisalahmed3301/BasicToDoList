const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const root = __dirname;
const dataDirectory = path.join(root, 'data');
const dataFile = path.join(dataDirectory, 'todos.json');

function readTodos() {
    try {
        return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (error) {
        return {};
    }
}

function writeTodos(todosByIp) {
    fs.mkdirSync(dataDirectory, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(todosByIp, null, 2));
}

function getClientIp(request) {
    return (request.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
}

function serveStatic(request, response) {
    const requestedPath = request.url === '/' ? '/index.html' : request.url;
    const filePath = path.normalize(path.join(root, requestedPath));

    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }

    const contentTypes = {
        '.css': 'text/css',
        '.html': 'text/html',
        '.js': 'application/javascript'
    };
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
    if (request.url === '/api/todos') {
        const todosByIp = readTodos();
        const ip = getClientIp(request);

        if (request.method === 'GET') {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(todosByIp[ip] || []));
            return;
        }

        if (request.method === 'PUT') {
            let body = '';
            request.on('data', chunk => { body += chunk; });
            request.on('end', () => {
                try {
                    const todos = JSON.parse(body);
                    if (!Array.isArray(todos)) throw new Error('Todos must be an array');
                    todosByIp[ip] = todos;
                    writeTodos(todosByIp);
                    response.writeHead(204);
                    response.end();
                } catch (error) {
                    response.writeHead(400, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Invalid todo data' }));
                }
            });
            return;
        }
    }

    serveStatic(request, response);
});

server.listen(port, () => {
    console.log(`Todo List running at http://localhost:${port}`);
});