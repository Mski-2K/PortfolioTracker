const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/config');
const Transaction = require('../models/Transaction');
const moment = require('moment');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/portfolio', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: 1 });
        const portfolio = await calculatePortfolio(transactions);
        const charts = await calculateCharts(transactions);
        
        res.json({ portfolio, charts });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Error fetching portfolio data' });
    }
});

router.post('/transactions', async (req, res) => {
    try {
        const { instrument, transactionType, date, amount, currency: portfolioCurrency } = req.body;
        console.log('Received transaction data:', { instrument, transactionType, date, amount, portfolioCurrency });

        const transactionDate = new Date(date);
        const today = new Date();
        if (transactionDate > today) {
            return res.status(400).json({
                error: 'Cannot add transactions with future dates. Please select a date not later than today.'
            });
        }

        let instrumentCurrency = 'USD';
        if (instrument.endsWith('.PL')) instrumentCurrency = 'PLN';
        if (instrument.endsWith('.DE')) instrumentCurrency = 'EUR';

        let price, quantity;
        if (transactionType === 'buy') {
            price = await getHistoricalPrice(instrument, date);
            if (!price) {
                return res.status(400).json({
                    error: 'Could not fetch historical price for given ticker and date. Please check if the ticker is correct and try a different date.'
                });
            }
            let amountInInstrumentCurrency = amount;
            if (portfolioCurrency !== instrumentCurrency) {
                const ratePortfolio = await getNBPRate(portfolioCurrency, date);
                const rateInstrument = await getNBPRate(instrumentCurrency, date);
                amountInInstrumentCurrency = amount * (ratePortfolio / rateInstrument);
            }
            console.log(`Portfolio currency: ${portfolioCurrency}, instrument currency: ${instrumentCurrency}`);
            quantity = amountInInstrumentCurrency / price;
        } else if (transactionType === 'sell') {
            const allTransactions = await Transaction.find({ instrument }).sort({ date: 1 });
            let owned = 0;
            for (const t of allTransactions) {
                if (t.transactionType === 'buy') owned += t.quantity;
                if (t.transactionType === 'sell') owned -= t.quantity;
            }
            price = await getHistoricalPrice(instrument, date);
            if (!price) {
                return res.status(400).json({
                    error: 'Could not fetch historical price for given ticker and date. Please check if the ticker is correct and try a different date.'
                });
            }
            let amountInInstrumentCurrency = amount;
            if (portfolioCurrency !== instrumentCurrency) {
                const rateInstrument = await getNBPRate(instrumentCurrency, date);
                amountInInstrumentCurrency = amount / rateInstrument;
            }
            quantity = amountInInstrumentCurrency / price;
            if (owned <= 0) {
                return res.status(400).json({
                    error: `You do not own any shares of ${instrument}. Cannot sell.`
                });
            }
            if (quantity > owned) {
                return res.status(400).json({
                    error: `You are trying to sell more shares (${quantity.toFixed(2)}) than you own (${owned.toFixed(2)}).`
                });
            }
        } else {
            return res.status(400).json({ error: 'Invalid transaction type.' });
        }

        const transaction = new Transaction({
            instrument,
            transactionType,
            date: transactionDate,
            quantity,
            price,
            currency: instrumentCurrency
        });

        await transaction.save();
        console.log('Transaction saved successfully');

        const transactions = await Transaction.find().sort({ date: 1 });
        const portfolio = await calculatePortfolio(transactions);
        const charts = await calculateCharts(transactions);
        
        res.json({ portfolio, charts });
    } catch (error) {
        console.error('Detailed error in transaction:', error);
        res.status(500).json({ 
            error: 'Error adding transaction',
            details: error.message 
        });
    }
});

async function getCurrentPriceYahoo(ticker) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
        const response = await axios.get(url);
        const result = response.data.chart.result[0];
        const quote = result.indicators.quote[0];
        const closes = quote.close;
        for (let i = closes.length - 1; i >= 0; i--) {
            if (closes[i] !== null) {
                return closes[i];
            }
        }
        return null;
    } catch (error) {
        console.error('Yahoo Finance current price error:', error.response?.data || error.message);
        return null;
    }
}

async function calculatePortfolio(transactions) {
    const portfolio = new Map();

    for (const transaction of transactions) {
        const { instrument, transactionType, quantity, price, currency } = transaction;
        
        if (!portfolio.has(instrument)) {
            portfolio.set(instrument, {
                instrument,
                quantity: 0,
                totalCost: 0,
                currency
            });
        }

        const position = portfolio.get(instrument);
        
        if (transactionType === 'buy') {
            position.quantity += quantity;
            position.totalCost += quantity * price;
        } else {
            position.quantity -= quantity;
            position.totalCost -= quantity * price;
        }
    }

    const portfolioArray = await Promise.all(Array.from(portfolio.values())
        .filter(position => position.quantity > 0)
        .map(async position => {
            const currentPrice = await getCurrentPriceYahoo(position.instrument);
            const currentValue = currentPrice ? position.quantity * currentPrice : 0;
            const avgPrice = position.totalCost / position.quantity;
            return {
                instrument: position.instrument,
                quantity: position.quantity,
                avgPrice,
                currentValue,
                profitLoss: currentValue - position.totalCost,
                currency: position.currency,
                currentPrice
            };
        }));

    return portfolioArray;
}

async function calculateCharts(transactions) {
    const capitalGains = [];
    const currencyGains = [];

    const transactionsByDate = transactions.reduce((acc, transaction) => {
        const date = transaction.date.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(transaction);
        return acc;
    }, {});

    for (const [date, dateTransactions] of Object.entries(transactionsByDate)) {
        let capitalGain = 0;
        let currencyGain = 0;

        for (const transaction of dateTransactions) {
            if (transaction.transactionType === 'sell') {
                const buyTransactions = transactions
                    .filter(t => t.instrument === transaction.instrument && 
                               t.transactionType === 'buy' && 
                               t.date < transaction.date)
                    .sort((a, b) => b.date - a.date);

                for (const buyTransaction of buyTransactions) {
                    const quantity = Math.min(buyTransaction.quantity, transaction.quantity);
                    const profit = (transaction.price - buyTransaction.price) * quantity;
                    capitalGain += profit;

                    if (transaction.currency !== buyTransaction.currency) {
                        const exchangeRate = await getExchangeRate(
                            buyTransaction.currency,
                            transaction.currency,
                            transaction.date
                        );
                        currencyGain += profit * (exchangeRate - 1);
                    }
                }
            }
        }

        capitalGains.push({ date, value: capitalGain });
        currencyGains.push({ date, value: currencyGain });
    }

    return { capitalGains, currencyGains };
}

async function getExchangeRate(fromCurrency, toCurrency, date) {
    if (fromCurrency === toCurrency) return 1;
    
    try {
        const response = await axios.get(`${config.nbpApiUrl}/A/${fromCurrency}/${date}`);
        return response.data.rates[0].mid;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return 1;
    }
}

async function getHistoricalPrice(ticker, date) {
    try {
        // Convert date to Unix timestamp (seconds)
        const targetDate = new Date(date);
        // Get data for a week before and after the target date
        const startDate = new Date(targetDate);
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 7);

        const startTimestamp = Math.floor(startDate.getTime() / 1000);
        const endTimestamp = Math.floor(endDate.getTime() / 1000);

        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
        console.log('Fetching from Yahoo Finance:', yahooUrl);
        
        const response = await axios.get(yahooUrl);
        console.log('Yahoo Finance Response:', JSON.stringify(response.data, null, 2));

        if (!response.data.chart.result || response.data.chart.result.length === 0) {
            console.error('No data found in Yahoo Finance response');
            return null;
        }

        const result = response.data.chart.result[0];
        const quote = result.indicators.quote[0];
        const timestamps = result.timestamp;
        const closes = quote.close;

        if (!timestamps || !closes) {
            console.error('No price data in the response');
            return null;
        }

        let price = null;
        let closestDate = null;
        let minDiff = Infinity;

        for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null) {
                const currentDate = new Date(timestamps[i] * 1000);
                const diff = Math.abs(currentDate - targetDate);
                
                if (diff < minDiff) {
                    minDiff = diff;
                    price = closes[i];
                    closestDate = currentDate;
                }
            }
        }

        if (price) {
            console.log(`Found price ${price} for date ${closestDate.toISOString().split('T')[0]}`);
            return price;
        }

        console.error('No price found in the response');
        return null;
    } catch (error) {
        console.error('Yahoo Finance API error:', error.response?.data || error.message);
        return null;
    }
}

function getPeriodLabel(date, interval) {
    if (interval === 'week') {
        const start = moment(date).startOf('isoWeek');
        const end = moment(date).endOf('isoWeek');
        return `${start.format('D MMM')} to ${end.format('D MMM YY')}`;
    } else if (interval === 'month') {
        return moment(date).format('MMMM YYYY');
    } else if (interval === 'quarter') {
        const quarter = moment(date).quarter();
        return `Q${quarter} ${moment(date).year()}`;
    }
    return date;
}

async function getNBPRate(currency, date) {
    if (currency === 'PLN') return 1;
    try {
        const d = moment(date).format('YYYY-MM-DD');
        const url = `${config.nbpApiUrl}/A/${currency}/${d}`;
        const response = await axios.get(url);
        return response.data.rates[0].mid;
    } catch (error) {
        try {
            const dPrev = moment(date).subtract(1, 'days').format('YYYY-MM-DD');
            const url = `${config.nbpApiUrl}/A/${currency}/${dPrev}`;
            const response = await axios.get(url);
            return response.data.rates[0].mid;
        } catch (e) {
            console.error('NBP rate error:', error.response?.data || error.message);
            return 1;
        }
    }
}

router.get('/portfolio/performance', async (req, res) => {
    try {
        const interval = req.query.interval || 'week';
        const transactions = await Transaction.find().sort({ date: 1 });
        const periods = {};
        for (const t of transactions) {
            const period = getPeriodLabel(t.date, interval);
            if (!periods[period]) {
                periods[period] = { capitalGain: 0, currencyGain: 0, dividends: 0 };
            }
        }
        const positions = {};
        for (const t of transactions) {
            if (!positions[t.instrument]) positions[t.instrument] = [];
            if (t.transactionType === 'buy') {
                positions[t.instrument].push({ ...t.toObject(), remaining: t.quantity });
            } else if (t.transactionType === 'sell') {
                let qtyToSell = t.quantity;
                let i = 0;
                while (qtyToSell > 0 && i < positions[t.instrument].length) {
                    const buy = positions[t.instrument][i];
                    if (buy.remaining > 0) {
                        const sellQty = Math.min(buy.remaining, qtyToSell);
                        const capitalGain = (t.price - buy.price) * sellQty;
                        let currencyGain = 0;
                        if (t.currency !== buy.currency) {
                            const sellRate = await getNBPRate(t.currency, t.date);
                            const buyRate = await getNBPRate(buy.currency, buy.date);
                            const sellValuePLN = t.price * sellQty * sellRate;
                            const buyValuePLN = buy.price * sellQty * buyRate;
                            currencyGain = sellValuePLN - buyValuePLN - capitalGain * sellRate;
                        }
                        const period = getPeriodLabel(t.date, interval);
                        periods[period].capitalGain += capitalGain;
                        periods[period].currencyGain += currencyGain;
                        // Dividends (optional, 0 for now)
                        buy.remaining -= sellQty;
                        qtyToSell -= sellQty;
                    }
                    i++;
                }
            }
        }
        const allPeriods = Object.keys(periods).sort((a, b) => {
            const aDate = moment(a.split(' to ')[0], 'D MMM');
            const bDate = moment(b.split(' to ')[0], 'D MMM');
            return aDate - bDate;
        });
        const performance = allPeriods.map(period => ({
            period,
            capitalGain: periods[period].capitalGain,
            currencyGain: periods[period].currencyGain,
            dividends: periods[period].dividends
        }));
        res.json({ performance });
    } catch (error) {
        console.error('Error in /portfolio/performance:', error);
        res.status(500).json({ error: 'Error generating performance chart' });
    }
});

router.get('/portfolio/value', async (req, res) => {
    try {
        const interval = req.query.interval || 'week';
        const portfolioCurrency = req.query.portfolioCurrency || 'PLN';
        const transactions = await Transaction.find().sort({ date: 1 });
        if (transactions.length === 0) {
            return res.json({ valueSeries: [] });
        }
        const firstDate = moment(transactions[0].date).startOf('day');
        const today = moment().startOf('day');
        let current = firstDate.clone();
        const periods = [];
        while (current.isSameOrBefore(today)) {
            periods.push(current.clone());
            if (interval === 'week') current.add(1, 'week');
            else if (interval === 'month') current.add(1, 'month');
            else if (interval === 'quarter') current.add(1, 'quarter');
        }
        const valueSeries = [];
        // Cache na ostatni znaleziony kurs NBP dla każdej waluty
        const lastKnownNBPRate = {};
        for (let i = 0; i < periods.length; i++) {
            const periodStart = periods[i];
            const periodEnd = periods[i + 1] ? periods[i + 1].clone().subtract(1, 'day') : today;
            const isLastPeriod = i === periods.length - 1;
            const effectiveDate = isLastPeriod ? today : periodEnd;
            const txs = transactions.filter(t => moment(t.date).isSameOrBefore(effectiveDate));
            const holdings = {};
            for (const t of txs) {
                if (!holdings[t.instrument]) holdings[t.instrument] = { quantity: 0, currency: t.currency };
                if (t.transactionType === 'buy') holdings[t.instrument].quantity += t.quantity;
                if (t.transactionType === 'sell') holdings[t.instrument].quantity -= t.quantity;
            }
            let totalValue = 0;
            for (const [instrument, h] of Object.entries(holdings)) {
                if (h.quantity <= 0) continue;
                // Szukaj najnowszej dostępnej ceny akcji
                let searchDatePrice = effectiveDate.clone();
                let price = null;
                for (let tries = 0; tries < 7; tries++) {
                    price = await getHistoricalPrice(instrument, searchDatePrice.format('YYYY-MM-DD'));
                    if (price) break;
                    searchDatePrice = searchDatePrice.clone().subtract(1, 'day');
                }
                if (!price) continue;
                // Szukaj najnowszego dostępnego kursu NBP instrumentu
                let searchDateInstr = effectiveDate.clone();
                let rateInstrument = null;
                for (let tries = 0; tries < 7; tries++) {
                    rateInstrument = await getNBPRate(h.currency, searchDateInstr.format('YYYY-MM-DD'));
                    if (rateInstrument) {
                        lastKnownNBPRate[h.currency] = rateInstrument;
                        break;
                    }
                    searchDateInstr = searchDateInstr.clone().subtract(1, 'day');
                }
                if (!rateInstrument) {
                    rateInstrument = lastKnownNBPRate[h.currency];
                }
                if (!rateInstrument) continue;
                // Szukaj najnowszego dostępnego kursu NBP portfela
                let searchDatePort = effectiveDate.clone();
                let ratePortfolio = null;
                for (let tries = 0; tries < 7; tries++) {
                    ratePortfolio = await getNBPRate(portfolioCurrency, searchDatePort.format('YYYY-MM-DD'));
                    if (ratePortfolio) {
                        lastKnownNBPRate[portfolioCurrency] = ratePortfolio;
                        break;
                    }
                    searchDatePort = searchDatePort.clone().subtract(1, 'day');
                }
                if (!ratePortfolio) {
                    ratePortfolio = lastKnownNBPRate[portfolioCurrency];
                }
                if (!ratePortfolio) continue;
                totalValue += h.quantity * price * rateInstrument / ratePortfolio;
            }
            valueSeries.push({
                period: getPeriodLabel(periodStart, interval),
                value: totalValue
            });
        }
        console.log(valueSeries);
        res.json({ valueSeries });
    } catch (error) {
        console.error('Error in /portfolio/value:', error);
        res.status(500).json({ error: 'Error generating portfolio value chart' });
    }
});

module.exports = router; 