import { Player as PlayerType, MonthlyExpenses, CapitalGains, Housing } from './types';
import { GAME_DATA } from '../data/gameData';

export interface Player {
    cash: number;
    age: number;
    currentYear: number;
    currentMonth: number;
    currentDay: number;
    stocks: Record<string, { shares: number; avgBuyPrice: number }>;
    properties: any[];
    savings: number;
    loans: any[];
    married: boolean;
    car: any;
    insurance: { health: boolean; home: boolean; car: boolean; contents: boolean };
    location: string;
    baseExpenses: { utilities: number; food: number; transport: number; entertainment: number; other: number };
    monthlyExpenses: MonthlyExpenses;
    monthlyIncome: number;
    jobLossMonths: number;
    children: number;
    lastMonthPrices: Record<string, number>;
    currentMonthPrices: Record<string, number>;
    dailyVolatility: number;
    capitalGains: CapitalGains;
    housing: Housing | null;
    monthlyHousingPayment: number;
}

export class Player implements PlayerType {
    cash: number;
    age: number;
    currentYear: number;
    currentMonth: number;
    currentDay: number;
    stocks: Record<string, { shares: number; avgBuyPrice: number }>;
    properties: any[];
    savings: number;
    loans: any[];
    married: boolean;
    car: any;
    insurance: { health: boolean; home: boolean; car: boolean; contents: boolean };
    location: string;
    baseExpenses: { utilities: number; food: number; transport: number; entertainment: number; other: number };
    monthlyExpenses: MonthlyExpenses;
    monthlyIncome: number;
    jobLossMonths: number;
    children: number;
    lastMonthPrices: Record<string, number>;
    currentMonthPrices: Record<string, number>;
    dailyVolatility: number;
    capitalGains: CapitalGains;
    housing: Housing | null;
    monthlyHousingPayment: number;

    constructor(name?: string) {
        this.cash = GAME_DATA.config.startingCash;
        this.age = GAME_DATA.config.startAge;
        this.currentYear = GAME_DATA.config.startYear;
        this.currentMonth = GAME_DATA.config.startMonth;
        this.currentDay = 1;
        this.stocks = {};
        this.properties = [];
        this.savings = 0;
        this.loans = [];
        this.married = false;
        this.car = null;
        this.insurance = {
            health: false,
            home: false,
            car: false,
            contents: false
        };
        this.location = 'London'; // Default location
        
        // Base expenses in 2005 prices (excluding rent which is calculated separately)
        this.baseExpenses = {
            utilities: 200,
            food: 300,
            transport: 150,
            entertainment: 200,
            other: 100
        };
        
        this.monthlyExpenses = { 
            utilities: 200,
            food: 300,
            transport: 150,
            entertainment: 200,
            other: 100,
            rent: 0 
        };
        
        this.monthlyIncome = this.calculateMonthlyIncome();
        this.jobLossMonths = 0;
        this.children = 0;
        this.lastMonthPrices = {};
        this.currentMonthPrices = {};
        this.dailyVolatility = 0.002; // 0.2% daily volatility for stocks
        
        // Capital gains tracking
        this.capitalGains = {
            currentTaxYear: 0,  // Realized gains in current tax year
            allowanceUsed: 0,   // How much of the tax-free allowance has been used
            taxPaid: 0          // Tax paid on gains this year
        };
        
        // Initialize stock prices
        this.initializeStockPrices();
        
        // Initialize rent
        this.updateRent();
        this.adjustExpensesForInflation();

        this.housing = null;
        this.monthlyHousingPayment = 0;
    }

    // Initialize stock prices at the start of the game
    initializeStockPrices() {
        // Initialize prices for all stocks
        for (const symbol in GAME_DATA.stocks) {
            const yearFraction = this.currentMonth / 12;
            const currentYearPrice = GAME_DATA.stocks[symbol][this.currentYear] || 0;
            const nextYearPrice = GAME_DATA.stocks[symbol][this.currentYear + 1] || currentYearPrice;
            
            this.currentMonthPrices[symbol] = currentYearPrice + (nextYearPrice - currentYearPrice) * yearFraction;
            this.lastMonthPrices[symbol] = this.currentMonthPrices[symbol];
        }
        
        // Initialize property prices too
        for (const location in GAME_DATA.housePrice) {
            const yearFraction = this.currentMonth / 12;
            const currentYearPrice = GAME_DATA.housePrice[location][this.currentYear] || 0;
            const nextYearPrice = GAME_DATA.housePrice[location][this.currentYear + 1] || currentYearPrice;
            
            this.currentMonthPrices[`property_${location}`] = currentYearPrice + (nextYearPrice - currentYearPrice) * yearFraction;
            this.lastMonthPrices[`property_${location}`] = this.currentMonthPrices[`property_${location}`];
        }
    }

    getDaysInMonth(month: number, year: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    calculateMonthlyIncome(): number {
        // Get yearly salary based on current year
        const yearlySalary = GAME_DATA.salaries[this.currentYear];
        // Monthly pre-tax income
        const monthlyPreTax = yearlySalary / 12;
        // Calculate tax
        const yearlyTax = this.calculateIncomeTax(yearlySalary);
        const monthlyTax = yearlyTax / 12;
        // Return monthly post-tax income
        return monthlyPreTax - monthlyTax;
    }

    calculateIncomeTax(yearlyIncome: number): number {
        // Find the closest tax year
        const taxYears = Object.keys(GAME_DATA.incomeTax).map(Number);
        let closestYear = taxYears[0];
        
        for (const year of taxYears) {
            if (year <= this.currentYear && year > closestYear) {
                closestYear = year;
            }
        }
        
        const brackets = GAME_DATA.incomeTax[closestYear];
        let tax = 0;
        
        // Calculate tax based on brackets
        for (let i = brackets.length - 1; i > 0; i--) {
            const currentBracket = brackets[i];
            const prevBracket = brackets[i - 1];
            
            if (yearlyIncome > prevBracket.threshold) {
                const amountInBracket = Math.min(
                    yearlyIncome - prevBracket.threshold,
                    (currentBracket.threshold - prevBracket.threshold) || Infinity
                );
                tax += amountInBracket * currentBracket.rate;
            }
        }
        
        return tax;
    }

    getTotalExpenses(): number {
        let total = 0;
        for (const category in this.monthlyExpenses) {
            total += this.monthlyExpenses[category as keyof MonthlyExpenses];
        }
        return total;
    }

    updateRent(): void {
        // If player owns a property for living or has a rental property, use that rent
        if (this.housing) {
            this.monthlyExpenses.rent = this.housing.type === 'RENT' ? this.monthlyHousingPayment : 0;
            return;
        }

        // Get base rent for current location and year
        const baseRent = GAME_DATA.rentPrice[this.location][this.currentYear] || 
                        GAME_DATA.rentPrice[this.location][Number(Object.keys(GAME_DATA.rentPrice[this.location]).slice(-1)[0])];
        
        // Adjust rent based on family size
        let rentMultiplier = 1;
        if (this.married) rentMultiplier += 0.3; // 30% more for couple
        if (this.children > 0) rentMultiplier += 0.2 * this.children; // 20% more per child

        this.monthlyExpenses.rent = baseRent * rentMultiplier;
    }

    adjustExpensesForInflation(): void {
        // Calculate cumulative inflation since 2005
        let cumulativeInflation = 1;
        for (let year = GAME_DATA.config.startYear; year <= this.currentYear; year++) {
            if (GAME_DATA.inflation[year]) {
                cumulativeInflation *= (1 + GAME_DATA.inflation[year] / 100);
            }
        }

        // Adjust each expense category for inflation (except rent which is handled separately)
        for (const category in this.baseExpenses) {
            this.monthlyExpenses[category as keyof Omit<MonthlyExpenses, 'rent'>] = 
                this.baseExpenses[category as keyof Omit<MonthlyExpenses, 'rent'>] * cumulativeInflation;
        }

        // Update rent for current year
        this.updateRent();
    }

    getNetWorth(): number {
        let stocksValue = 0;
        for (const symbol in this.stocks) {
            const stock = this.stocks[symbol];
            const currentPrice = this.getCurrentStockPrice(symbol);
            // Skip invalid prices
            if (isNaN(currentPrice) || currentPrice === undefined) {
                continue;
            }
            stocksValue += stock.shares * currentPrice;
        }

        let propertiesValue = 0;
        for (const property of this.properties) {
            const propertyValue = this.getCurrentPropertyValue(property);
            // Skip invalid values
            if (isNaN(propertyValue) || propertyValue === undefined) {
                continue;
            }
            propertiesValue += propertyValue;
        }

        let loansValue = 0;
        for (const loan of this.loans) {
            loansValue += loan.remainingAmount || 0;
        }

        let carValue = this.car ? (this.car.value || 0) : 0;

        return this.cash + stocksValue + propertiesValue + this.savings + carValue - loansValue;
    }

    getCurrentStockPrice(symbol: string): number {
        // Make sure the symbol exists in the stock data
        if (!GAME_DATA.stocks[symbol]) {
            console.error(`Stock symbol ${symbol} not found in game data`);
            return 0;
        }

        // On the first day of the month, calculate and store the actual monthly prices
        if (this.currentDay === 1) {
            const yearFraction = this.currentMonth / 12;
            const currentYearPrice = GAME_DATA.stocks[symbol][this.currentYear] || 0;
            const nextYearPrice = GAME_DATA.stocks[symbol][this.currentYear + 1] || currentYearPrice;
            
            this.lastMonthPrices[symbol] = this.currentMonthPrices[symbol] || currentYearPrice;
            this.currentMonthPrices[symbol] = currentYearPrice + (nextYearPrice - currentYearPrice) * yearFraction;
        }

        // If prices are not initialized yet, initialize them
        if (!this.currentMonthPrices[symbol]) {
            const yearFraction = this.currentMonth / 12;
            const currentYearPrice = GAME_DATA.stocks[symbol][this.currentYear] || 0;
            const nextYearPrice = GAME_DATA.stocks[symbol][this.currentYear + 1] || currentYearPrice;
            
            this.currentMonthPrices[symbol] = currentYearPrice + (nextYearPrice - currentYearPrice) * yearFraction;
            this.lastMonthPrices[symbol] = this.currentMonthPrices[symbol];
        }

        // Interpolate between last month and current month prices with daily randomness
        const daysInMonth = this.getDaysInMonth(this.currentMonth, this.currentYear);
        const dayProgress = (this.currentDay - 1) / daysInMonth;
        
        const lastPrice = this.lastMonthPrices[symbol] || this.currentMonthPrices[symbol];
        const targetPrice = this.currentMonthPrices[symbol];
        const basePrice = lastPrice + (targetPrice - lastPrice) * dayProgress;

        // Add daily random variation (but ensure we hit the target on month end)
        if (this.currentDay === daysInMonth) {
            return targetPrice;
        } else {
            const randomFactor = 1 + (Math.random() - 0.5) * this.dailyVolatility;
            return basePrice * randomFactor;
        }
    }

    getCurrentPropertyValue(property: any): number {
        const pricePerSqm = this.getCurrentPropertyPricePerSqm(property.location);
        return property.size * pricePerSqm;
    }

    getCurrentPropertyPricePerSqm(location: string): number {
        // On the first day of the month, calculate and store the actual monthly prices
        if (this.currentDay === 1) {
            const yearFraction = this.currentMonth / 12;
            const currentYearPrice = GAME_DATA.housePrice[location][this.currentYear] || 0;
            const nextYearPrice = GAME_DATA.housePrice[location][this.currentYear + 1] || currentYearPrice;
            
            this.lastMonthPrices[`property_${location}`] = this.currentMonthPrices[`property_${location}`] || currentYearPrice;
            this.currentMonthPrices[`property_${location}`] = currentYearPrice + (nextYearPrice - currentYearPrice) * yearFraction;
        }

        // Interpolate between last month and current month prices with subtle daily randomness
        const daysInMonth = this.getDaysInMonth(this.currentMonth, this.currentYear);
        const dayProgress = (this.currentDay - 1) / daysInMonth;
        
        const lastPrice = this.lastMonthPrices[`property_${location}`] || this.currentMonthPrices[`property_${location}`];
        const targetPrice = this.currentMonthPrices[`property_${location}`];
        const basePrice = lastPrice + (targetPrice - lastPrice) * dayProgress;

        // Add very subtle daily random variation for properties (less volatile than stocks)
        if (this.currentDay === daysInMonth) {
            return targetPrice;
        } else {
            const randomFactor = 1 + (Math.random() - 0.5) * (this.dailyVolatility / 4); // Less volatile than stocks
            return basePrice * randomFactor;
        }
    }

    // Calculate capital gains tax based on current tax year rates
    calculateCapitalGainsTax(): number {
        // In the UK, the tax year runs from April 6 to April 5 of the following year
        // For simplicity, we'll use April 1 as the tax year end
        
        // Skip if no capital gains
        if (this.capitalGains.currentTaxYear <= 0) {
            return 0;
        }
        
        // Find the applicable tax year rates
        const taxYears = Object.keys(GAME_DATA.capitalGainsTax).map(Number);
        let closestYear = taxYears[0];
        
        for (const year of taxYears) {
            if (year <= this.currentYear && year > closestYear) {
                closestYear = year;
            }
        }
        
        const taxRates = GAME_DATA.capitalGainsTax[closestYear];
        
        // Calculate taxable amount after allowance
        const totalGains = this.capitalGains.currentTaxYear;
        const allowance = taxRates.allowance;
        const taxableGain = Math.max(0, totalGains - allowance);
        
        // For simplicity, we'll use the higher rate for all gains
        // In a more complex implementation, we would check the player's income bracket
        const taxRate = taxRates.higherRate;
        const taxDue = taxableGain * taxRate;
        
        return taxDue;
    }
}

export const createPlayer = (name: string): Player => {
    return new Player(name);
}; 