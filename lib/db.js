import mysql from 'mysql2/promise';

// Get MySQL config from environment
const getConfig = () => {
  // For Vercel (JawsDB or Aiven)
  if (process.env.JAWSDB_MARIA_URL) {
    const url = new URL(process.env.JAWSDB_MARIA_URL);
    return {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false }
    };
  }
  
  // For Aiven MySQL
  if (process.env.MYSQL_HOST) {
    return {
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: { rejectUnauthorized: false }
    };
  }
  
  // For local development
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'due_manager'
  };
};

const config = getConfig();
console.log('📦 Connecting to MySQL:', config.host);

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+05:00'
});

export { pool };