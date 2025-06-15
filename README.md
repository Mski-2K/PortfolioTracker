# Portfolio Manager

A simple portfolio management system for XTB transactions that visualizes your portfolio value over time in a selected currency.

## Features

- Add buy/sell transactions for any instrument (e.g. AAPL, MSFT, etc.)
- Select a global portfolio currency (PLN, USD, EUR, GBP) in the top right corner
- All transaction amounts are entered in the selected portfolio currency
- Automatic conversion to instrument currency using NBP rates on transaction date
- Portfolio value chart over time (week/month/quarter) in the selected currency
- Real-time price and currency conversion for portfolio valuation
- Capital/currency gain calculation based on real NBP rates
- MongoDB integration for data persistence

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/portfolio-manager
PORT=3000
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Select your portfolio currency in the top right corner (default: PLN)
2. Add transactions using the form (amount is always in the selected portfolio currency)
3. View the portfolio value chart over time (choose week/month/quarter)
4. All calculations and conversions are automatic (NBP rates, Yahoo Finance prices)

## API Integration

- NBP API for currency exchange rates
- Yahoo Finance for historical and current stock prices

## License

MIT 