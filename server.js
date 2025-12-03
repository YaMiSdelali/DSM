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
    console.log('📧 Отправка письма:', {
        to: process.env.ADMIN_EMAIL || '23853ap@gmail.com',
        hasApiKey: !!process.env.RESEND_API_KEY,
        time: new Date().toISOString()
    });
    
    return resend.emails.send({
        from: 'onboarding@resend.dev',
        to: process.env.ADMIN_EMAIL || '23853ap@gmail.com',
        subject: 'Новый вопрос с сайта ЦСМ',
        html: `Сообщение от: ${form.name}.<br>${form.message}<br>Связаться можно через: ${form.contact}`
    })
    .then(response => {
        console.log('✅ Письмо отправлено успешно:', response.id);
        return response;
    })
    .catch(error => {
        console.error('❌ Ошибка отправки письма:', error.message);
        // Не прерываем выполнение, просто логируем
        return null;
    });
}

const postgre = new pg.Pool(DataBaseCreate());

// СОЗДАНИЕ СЕРВЕРА (обратите внимание на имя переменной)
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Health check для Render (ОБЯЗАТЕЛЬНО)
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
        
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const { name, contact, message } = JSON.parse(body);
            
            postgre.query(
                'INSERT INTO messinfo (name, contact, message) VALUES ($1, $2, $3)',
                [name, contact, message]
            )
            .then(() => {
                return sendMail({ name, contact, message });
            })
            .then(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Данные сохранены' }));
            })
            .catch(error => {
                console.error('Ошибка:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Внутренняя ошибка сервера' }));
            });
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Функция создания таблиц
function createTables() {
    return postgre.query(`
        CREATE TABLE IF NOT EXISTS messinfo(
            name VARCHAR(100),
            contact VARCHAR(100),
            message TEXT
        )`);
}

// Запуск сервера
const PORT = process.env.PORT || 3000;

createTables()
    .then(() => {
        console.log('✅ Таблицы БД готовы');
        
        server.listen(PORT, () => {
            console.log(`✅ Сервер запущен на порту ${PORT}`);
            console.log(`✅ URL: https://dsm-94vn.onrender.com`);
        });
        
        server.on('error', (error) => {
            console.error('❌ Ошибка сервера:', error.message);
        });
    })
    .catch(error => {
        console.error('❌ Ошибка при создании таблиц:', error.message);
        process.exit(1);
    });





