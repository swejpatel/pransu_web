import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET all categories (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [categories] = await pool.query<RowDataPacket[]>(
      'SELECT *, (SELECT COUNT(*) FROM photos WHERE category_id = categories.id) as photo_count FROM categories ORDER BY sort_order ASC, name ASC'
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST create category
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { name, slug } = req.body;
  if (!name) { res.status(400).json({ error: 'Name required' }); return; }
  const s = slug || name.toLowerCase().replace(/\s+/g, '-');
  
  try {
    const [result] = await pool.query<ResultSetHeader>('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, s]);
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(400).json({ error: 'Category already exists' });
  }
});

// DELETE category
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    // First, delete all photos inside this album so they drop from the database!
    await pool.query('DELETE FROM photos WHERE category_id = ?', [req.params.id]);
    // Then delete the category itself
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category and all associated photos deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update category orders
router.put('/reorder', authenticate, async (req: Request, res: Response) => {
  const updates = req.body as { id: number, sort_order: number }[];
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      for (const update of updates) {
        await connection.query('UPDATE categories SET sort_order = ? WHERE id = ?', [update.sort_order, update.id]);
      }
      await connection.commit();
      res.json({ message: 'Order updated' });
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
