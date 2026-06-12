import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pransu_web',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
  } as any,
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// GET all photos (public - visible only)
router.get('/', async (req: Request, res: Response) => {
  const { category, type, limit } = req.query;
  let query = 'SELECT p.*, c.name as category_name FROM photos p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_visible = 1';
  const params: (string | number)[] = [];

  if (category && category !== 'all') {
    query += ' AND c.slug = ?';
    params.push(category as string);
  }
  if (type === 'hero') query += ' AND p.is_hero = 1 ORDER BY p.hero_order ASC';
  else if (type === 'featured') query += ' AND p.is_featured = 1 ORDER BY p.featured_order ASC';
  else query += ' ORDER BY p.sort_order ASC, p.created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(Number(limit));
  }

  try {
    const [photos] = await pool.query<RowDataPacket[]>(query, params);
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET all photos (admin - all including hidden)
router.get('/admin/all', authenticate, async (_req: Request, res: Response) => {
  try {
    const [photos] = await pool.query<RowDataPacket[]>(
      'SELECT p.*, c.name as category_name FROM photos p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.sort_order ASC, p.created_at DESC'
    );
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST upload photo
router.post('/', authenticate, upload.single('photo'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  const { title, description, category_id, is_hero, is_featured, is_gallery, is_visible } = req.body;

  try {
    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO photos (filename, original_name, title, description, category_id, file_size, is_hero, is_featured, is_gallery, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.file.path,
      req.file.originalname,
      title || '',
      description || '',
      category_id ? Number(category_id) : null,
      req.file.size,
      is_hero === 'true' ? 1 : 0,
      is_featured === 'true' ? 1 : 0,
      is_gallery !== 'false' ? 1 : 0,
      is_visible !== 'false' ? 1 : 0,
    ]);

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM photos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update photo
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, category_id, is_hero, is_featured, is_gallery, is_visible, hero_order, featured_order, gallery_order } = req.body;

  try {
    await pool.query(`
      UPDATE photos SET
        title = ?, description = ?, category_id = ?,
        is_hero = ?, hero_order = ?,
        is_featured = ?, featured_order = ?,
        is_gallery = ?, gallery_order = ?,
        is_visible = ?
      WHERE id = ?
    `, [
      title, description, category_id || null,
      is_hero ? 1 : 0, hero_order || 0,
      is_featured ? 1 : 0, featured_order || 0,
      is_gallery ? 1 : 0, gallery_order || 0,
      is_visible ? 1 : 0, id
    ]);

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM photos WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE photo
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM photos WHERE id = ?', [id]);
    const photo = rows[0];
    
    if (!photo) { res.status(404).json({ error: 'Photo not found' }); return; }

    // Cloudinary deletion can be added here if needed in the future
    // For now, we just remove the database record
    
    await pool.query('DELETE FROM photos WHERE id = ?', [id]);
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update photo orders
router.put('/reorder', authenticate, async (req: Request, res: Response) => {
  const updates = req.body as { id: number, sort_order: number }[];
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      for (const update of updates) {
        await connection.query('UPDATE photos SET sort_order = ? WHERE id = ?', [update.sort_order, update.id]);
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
