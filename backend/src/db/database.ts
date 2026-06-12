import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pransu',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    
    // Initialize tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(191) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(191) UNIQUE NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) DEFAULT '',
        description TEXT,
        category_id INT,
        width INT DEFAULT 0,
        height INT DEFAULT 0,
        file_size INT DEFAULT 0,
        is_hero TINYINT(1) DEFAULT 0,
        hero_order INT DEFAULT 0,
        is_featured TINYINT(1) DEFAULT 0,
        featured_order INT DEFAULT 0,
        is_gallery TINYINT(1) DEFAULT 1,
        gallery_order INT DEFAULT 0,
        sort_order INT DEFAULT 0,
        is_visible TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);

    // Run migrations safely for existing DBs
    try { await connection.query('ALTER TABLE categories ADD COLUMN sort_order INT DEFAULT 0;'); } catch(e) {}
    try { await connection.query('ALTER TABLE photos ADD COLUMN sort_order INT DEFAULT 0;'); } catch(e) {}

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(191) PRIMARY KEY,
        value TEXT
      );
    `);

    // Seed default admin user
    const [users] = await connection.query<mysql.RowDataPacket[]>('SELECT id FROM users WHERE username = ?', ['admin']);
    if (users.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await connection.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', ['admin', hash]);
      console.log('✅ Default admin created: admin / admin123');
    }

    // Seed default settings
    const defaultSettings: Record<string, string> = {
      site_name: 'LENS & LIGHT',
      tagline: 'Capturing moments that last forever',
      hero_title: 'Through the Lens',
      hero_subtitle: 'A journey of light, shadow and story',
      about_text: 'Professional photographer capturing the world one frame at a time.',
      footer_text: '© 2025 Lens & Light. All rights reserved.',
      accent_color: '#c9a96e',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await connection.query('INSERT IGNORE INTO settings (\`key\`, value) VALUES (?, ?)', [key, value]);
    }

    // Seed default categories
    const cats = ['Landscape', 'Portrait', 'Street', 'Nature', 'Architecture', 'Travel'];
    for (const cat of cats) {
      await connection.query('INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)', [cat, cat.toLowerCase()]);
    }

    connection.release();
    console.log('✅ MySQL Database initialized successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

initDB();

export default pool;
