//Бекчасть
const http = require('http');
const pg = require('pg');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_Caf8RFKe_76FGuaP8HroruqAEBrtW5Dte');

function DataBaseCreate() {
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    } else {
        return {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '12345',
            database: 'Kgeumes'
        };
    }
}

function sendMail(form) {
    return resend.emails.send({
        from: 'onboarding@resend.dev',
        to: process.env.ADMIN_EMAIL || 'ianova.oiu@kgeu.ru',
        subject: 'Новый вопрос с сайта ЦСМ',
        html: `Сообщение от: ${form.name}.<br>${form.message}<br>Связаться можно через: ${form.contact}`
    })
    .then(response => {})
    .catch(error => {
        console.error('Ошибка отправки письма:', error.message);
        return null;
    });
}

const postgre = new pg.Pool(DataBaseCreate());

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok',
            service: 'DSM API',
            timestamp: new Date().toISOString()
        }));
        return;
    }
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    if (req.method === 'POST' && req.url === '/api/message') {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    }); 
    req.on('end', async () => {
        try {
            if (!body || body.trim() === '') {
                throw new Error('Empty request body');
            }
            const data = JSON.parse(body);
            
            const { name, contact, message } = data;
            if (!name || !contact || !message) {
                console.error('Не все поля заполнены:', { name: !!name, contact: !!contact, message: !!message });
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Все поля обязательны',
                    received: { 
                        hasName: !!name, 
                        hasContact: !!contact, 
                        hasMessage: !!message 
                    }
                }));
                return;
            }
            await postgre.query(
                'INSERT INTO messinfo (name, contact, message) VALUES ($1, $2, $3)',
                [name, contact, message]
            );
            
            const emailResult = await sendMail({ name, contact, message });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: 'Данные сохранены и отправлены',
                emailSent: !!emailResult
            }));
            
        } catch (error) {
            console.error('Ошибка обработки запроса:', {
                error: error.message,
                bodyPreview: body.substring(0, 200),
                url: req.url,
                method: req.method
            });
            
            const statusCode = error.message.includes('JSON') ? 400 : 500;
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                error: error.message.includes('JSON') ? 'Неверный формат JSON' : 'Внутренняя ошибка сервера',
                timestamp: new Date().toISOString()
            }));
        }
    });
    
    req.on('error', (err) => {
        console.error('Ошибка чтения запроса:', err.message);
    });
} else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function createTables() {
    return postgre.query(`
        CREATE TABLE IF NOT EXISTS messinfo(
            name VARCHAR(100),
            contact VARCHAR(100),
            message TEXT
        )`);
}

const PORT = process.env.PORT || 3000;

createTables()
    .then(() => {
        
        server.listen(PORT, () => {});
        
        server.on('error', (error) => {
            console.error('Ошибка сервера:', error.message);
        });
    })
    .catch(error => {
        console.error('Ошибка при создании таблиц:', error.message);
        process.exit(1);
    });









