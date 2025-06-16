require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-manager',
  nbpApiUrl: 'http://api.nbp.pl/api/exchangerates/rates',
  port: 5000
};