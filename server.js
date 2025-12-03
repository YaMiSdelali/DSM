//Бекчасть
const secur = require('http');
const pg = require('pg');
const { Resend } = require('resend');
const res = new Resend(process.env.RESND_API_KEY || 're_Caf8RFKe_76FGuaP8HroruqAEBrtW5Dte');

function DataBaseCreate(){
    if(process.env.DATABASE_URL){
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: {rejectUnauthorized: false}
        };
    }
    else {
        return{
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '12345',
            database: 'Kgeumes'
        };
    }
}
function sendMail(form){
    return res.emails.send({
        from: 'onboarding@resend.dev',
        to: process.env.ADMIN_EMAIL || 'mertvyjmedved@gmail.com',
        subject: 'Новый вопрос с сайта ЦСМ',
        html: `Сообщение от: ${form.name}.
        ${form.message}
        Связаться можно через: ${form.contact}`
    })
}
const postgre = new pg.Pool(DataBaseCreate());

let serversite = secur.createServer((inputus, outputser) =>{
    outputser.setHeader('Access-Control-Allow-Origin', '*');
    outputser.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    outputser.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (inputus.method === 'OPTIONS') {
        outputser.writeHead(200);
        outputser.end();
        return;
    }
    
    if (inputus.method === 'POST' && inputus.url === '/api/message') {
        let body = '';
        
        inputus.on('data', chunk => body += chunk.toString());
        inputus.on('end', () => {
            const { name, contact, message } = JSON.parse(body);
            
            postgre.query(
                'INSERT INTO messinfo (name, contact, message) VALUES ($1, $2, $3)',
                [name, contact, message]
            )
            .then(() => {
                return sendMail({ name, contact, message});
            })
            .then(() => {
                outputser.end('Данные сохранены в БД и отправлены на почту');
            })
            .catch(error => {
                outputser.writeHead(500);
                outputser.end('Ошибка: ' + error.message);
            });
        });
    }
});

function createTables(){
    return postgre.query(`CREATE TABLE IF NOT EXISTS messinfo(
        name VARCHAR(100),
        contact VARCHAR(100),
        message TEXT)`);
}

/*const PORTING = process.env.PORT || 8080;

createTables().then(() => {
    serversite.listen(PORTING, () => {
        console.log(`Сервер запущен на порту ${PORTING}`);
    });
});*/

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Создаем таблицы
        await createTables();
        console.log('✅ Таблицы БД готовы');
        
        // Запускаем сервер
        server.listen(PORT, () => {
            console.log(`✅ Сервер запущен на порту: ${PORT}`);
            console.log(`✅ URL: https://dsm-94vn.onrender.com`);
            console.log(`✅ Режим: ${process.env.NODE_ENV || 'development'}`);
            
            // Проверка подключения к БД
            postgre.query('SELECT 1')
                .then(() => console.log('✅ База данных подключена'))
                .catch(err => console.error('❌ Ошибка БД:', err.message));
        });
        
        // Обработка ошибок сервера
        server.on('error', (error) => {
            console.error('❌ Ошибка сервера:', error.message);
            if (error.code === 'EADDRINUSE') {
                console.error(`Порт ${PORT} уже занят!`);
            }
        });
        
    } catch (error) {
        console.error('❌ Не удалось запустить сервер:', error.message);
        process.exit(1);
    }
}

// Запускаем сервер
startServer();



