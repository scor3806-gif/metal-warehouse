const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('Ошибка чтения:', e.message);
    return [];
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Ошибка записи:', e.message);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/api/items') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(readData()));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.type || data.quantity === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Нужны тип и количество' }));
            return;
          }

          const items = readData();
          const newItem = {
            id: generateId(),
            type: String(data.type || '').trim(),
            grade: String(data.grade || '').trim(),
            size1: String(data.size1 || '').trim(),
            size2: String(data.size2 || '').trim(),
            quantity: Number(data.quantity) || 0,
            comment: String(data.comment || '').trim(),
            updatedAt: new Date().toISOString()
          };
          items.push(newItem);
          writeData(items);

          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(newItem));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Неверный JSON' }));
        }
      });
      return;
    }
  }

  const itemMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
  if (itemMatch) {
    const id = itemMatch[1];

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const items = readData();
          const index = items.findIndex(i => i.id === id);

          if (index === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Не найдено' }));
            return;
          }

          if (data.type !== undefined) items[index].type = String(data.type).trim();
          if (data.grade !== undefined) items[index].grade = String(data.grade).trim();
          if (data.size1 !== undefined) items[index].size1 = String(data.size1).trim();
          if (data.size2 !== undefined) items[index].size2 = String(data.size2).trim();
          if (data.quantity !== undefined) items[index].quantity = Number(data.quantity) || 0;
          if (data.comment !== undefined) items[index].comment = String(data.comment).trim();
          items[index].updatedAt = new Date().toISOString();

          writeData(items);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(items[index]));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Ошибка' }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      const items = readData();
      const index = items.findIndex(i => i.id === id);
      if (index === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Не найдено' }));
        return;
      }
      items.splice(index, 1);
      writeData(items);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
  }

  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Не найдено');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log('  Склад металла запущен!');
  console.log('  Локально:  http://localhost:' + PORT);
  console.log('  По сети:   http://ВАШ_IP:' + PORT);
  console.log('========================================');
  console.log('');
  console.log('Чтобы узнать IP: выполните в командной строке команду  ipconfig');
  console.log('Остановка: Ctrl + C');
  console.log('');
});
