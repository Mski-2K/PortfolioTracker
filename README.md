# Portfolio Manager

A simple portfolio management system for XTB transactions that visualizes capital gains and currency exchange gains.

## Features

- Upload and process XTB Excel files
- Visualize capital gains with bar charts
- Track currency exchange gains
- Integration with NBP API for currency rates
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
STOCK_API_KEY=your_stock_api_key_here
```

4. Create an `uploads` directory in the root folder:
```bash
mkdir uploads
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

1. Open the application in your web browser
2. Upload your XTB Excel file using the upload form
3. View the generated charts showing capital gains and currency exchange gains

## API Integration

The application integrates with:
- NBP API for currency exchange rates
- Stock market API for current stock prices (requires API key)

## License

MIT 