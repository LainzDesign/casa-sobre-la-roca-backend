const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date ASC LIMIT 200');
    res.json({ events: result.rows });
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

    const { name, date, location, description } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO events (name, date, location, description) VALUES ($1,$2,$3,$4) RETURNING *`,
        [name, date, location, description]
      );
      res.status(201).json({ event: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
);

router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, date, location, description } = req.body;
  try {
    const result = await db.query(
      `UPDATE events SET name=$1, date=$2, location=$3, description=$4 WHERE id=$5 RETURNING *`,
      [name, date, location, description, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
