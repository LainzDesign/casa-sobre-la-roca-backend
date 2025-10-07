const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(apiLimiter);

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const donationsRoutes = require('./routes/donations');
const eventsRoutes = require('./routes/events');

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/events', eventsRoutes);

app.get('/', (req, res) => res.json({ ok: true, service: 'Sistema de Donaciones - Casa Sobre La Roca API' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
