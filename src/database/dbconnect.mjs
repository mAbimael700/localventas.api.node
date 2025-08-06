import { createPool } from "mariadb";

const options = {
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  user: 'root',
  password: process.env.DB_PASSWORD,
  connectionLimit: 20,
  database: "localventasdb",
};

export const pool = createPool(options);

const dbConnHandleErrors = {
  PROTOCOL_CONNECTION_LOST: "Database connection lost",
  ER_CON_COUNT_ERROR: "Database has too many connections",
  ECONNREFUSED: "Database connection refused",
  ER_GET_CONNECTION_TIMEOUT: "Database is not available",
  ER_ACCESS_DENIED_ERROR: "Access denied - check credentials",
  ER_BAD_DB_ERROR: "Database does not exist"
};

const poolConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`Connected! Connection ID: ${conn.threadId}`);
    return conn; // Return connection for queries
  } catch (err) {
    const errorMessage = dbConnHandleErrors[err.code] || 
                        `Database error: ${err.message}`;
    console.error(errorMessage);
    throw err; // Re-throw for handling in calling code
  }
};

// Test connection on startup
poolConnection()
  .then(conn => conn.release())
  .catch(err => console.error("Initial connection failed:", err.message));


export default { poolConnection };
