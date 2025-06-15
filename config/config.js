require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio-manager',
  nbpApiUrl: 'http://api.nbp.pl/api/exchangerates/rates',
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
  port: 5000
};