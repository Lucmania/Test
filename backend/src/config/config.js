require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'Holiwis123',
    JWT_EXPIRES_IN: '24h'
};
