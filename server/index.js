const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const eventRoutes = require('./routes/events');

const app = express();

const allowedOrigins = [
  'https://bookit-event.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(cors(corsOptions));
app.use(express.json());

// Health routes must stay above DB middleware so the function never crashes on '/'
app.get('/', (req, res) => res.status(200).send('Express server operational and live.'));
app.get('/api', (req, res) => res.status(200).send('Express server operational and live.'));

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in Vercel environment variables.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });

  console.log('Database connected successfully');
};

const requireDatabase = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failure:', err.message);
    return res.status(500).json({
      message: 'Database connection failed.',
      error: err.message
    });
  }
};

app.use('/auth', requireDatabase, authRoutes);
app.use('/bookings', requireDatabase, bookingRoutes);
app.use('/events', requireDatabase, eventRoutes);

app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/bookings', requireDatabase, bookingRoutes);
app.use('/api/events', requireDatabase, eventRoutes);

app.use((req, res) => res.status(404).json({ message: 'API endpoint route not found.' }));

module.exports = app;
