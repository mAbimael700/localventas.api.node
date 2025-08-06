import { pool } from "../database/dbconnect.mjs";

export async function generateId({ table }) {
  const query = `SELECT COUNT(*) + 1 AS newId FROM ${table}`;

  try {
    const result = await pool.query(query);
    const newID = result[0].newId; // Assuming the count is accessible this way

    return newID;
  } catch (error) {
    // Handle the error appropriately
    console.error("Error generating ID:", error);
    throw error;
  }
}
