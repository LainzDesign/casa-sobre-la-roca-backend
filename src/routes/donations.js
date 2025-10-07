const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT d.*, c.name as donor_name FROM donations d LEFT JOIN contacts c ON c.id = d.donor_id ORDER BY d.date DESC LIMIT 1000');
    res.json({ donations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/', auth,
  body('amount').isFloat({ gt: 0 }),
  body('date').isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { donor_id, amount, date, method, campaign, receipt_id } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO donations (donor_id, amount, date, method, campaign, receipt_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [donor_id || null, amount, date, method, campaign, receipt_id]
      );
      res.status(201).json({ donation: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
);

router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT d.*, c.name as donor_name FROM donations d LEFT JOIN contacts c ON c.id = d.donor_id WHERE d.id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ donation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { donor_id, amount, date, method, campaign, receipt_id } = req.body;
  try {
    const result = await db.query(
      `UPDATE donations SET donor_id=$1, amount=$2, date=$3, method=$4, campaign=$5, receipt_id=$6 WHERE id=$7 RETURNING *`,
      [donor_id || null, amount, date, method, campaign, receipt_id, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ donation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM donations WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
