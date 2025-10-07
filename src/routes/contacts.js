const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const q = req.query.q || '';
  try {
    const result = await db.query(
      `SELECT id, name, type, email, phone, address, notes, created_at FROM contacts
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC LIMIT 500`,
      [`%${q}%`]
    );
    res.json({ contacts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', auth,
  body('name').isLength({ min: 2 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, type, email, phone, address, notes } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO contacts (name, type, email, phone, address, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, type, email, phone, address, notes, created_at`,
        [name, type, email, phone, address, notes]
      );
      res.status(201).json({ contact: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
);

router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ contact: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, type, email, phone, address, notes } = req.body;
  try {
    const result = await db.query(
      `UPDATE contacts SET name=$1, type=$2, email=$3, phone=$4, address=$5, notes=$6 WHERE id=$7 RETURNING *`,
      [name, type, email, phone, address, notes, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ contact: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM contacts WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
