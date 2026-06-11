import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET all settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT \`key\`, value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update settings
router.put('/', authenticate, async (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const [key, value] of Object.entries(updates)) {
        await connection.query('INSERT INTO settings (\`key\`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?', [key, value, value]);
      }
      await connection.commit();
      res.json({ message: 'Settings updated' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
