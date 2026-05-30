const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { Pool } = require('pg');
dotenv.config();

const execAsync = promisify(exec);

async function runMigrations() {
  console.log('Запуск миграций базы данных...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,       
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 60000,
    ssl: {
        rejectUnauthorized: false 
    }
});
  let client
  try {
    client = await pool.connect()
    
    const migrationFile = path.join(__dirname, '../d.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error('Файл миграции не найден:', migrationFile);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    const commands = sql.split(';/n').filter(cmd => cmd.trim());
    
    console.log(` Найдено ${commands.length} SQL команд для выполнения`);
    
    await client.query('BEGIN');
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      console.log(`\n Выполнение команды ${i + 1}/${commands.length}...`);
      // console.log(`command`, command);
      
      try {
        await client.query(command);

        
      } catch (error) {
        console.error(`Ошибка выполнения команды ${i + 1}:`, error.message);
        throw error;
      }
    }
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    // Создаем пользователя
    
    const t = await client.query(
        `INSERT INTO users (email, password, role, active) VALUES ($1, $2, 'admin', true) RETURNING *`,
        [ process.env.ADMIN_NAME, hashedPassword ]
    );
    await client.query('COMMIT');
    
    console.log('\nВсе миграции успешно выполнены!', t);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка выполнения миграций:', error);
    process.exit(1);
  } finally {
    // Освобождаем ресурсы
    if (client) {
      client.release();
      console.log('🔌 Клиент освобожден');
    }
    await pool.end();
    console.log('🔌 Пул соединений закрыт');
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;