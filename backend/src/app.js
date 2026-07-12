const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { env } = require('./config');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorMiddleware);

module.exports = app;
