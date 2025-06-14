import { Player as PlayerType, MonthlyExpenses, CapitalGains, Housing } from './types';
import { GAME_DATA, Region } from '../data/gameData';

interface PlayerConfig {
    startingCash: number;
    baseSalary: number;
}

interface HappinessFactors {
    financial: number;
    living: number;
    workLife: number;
    social: number;
    health: number;
}

interface HappinessModifiers {
    shortTerm: { value: number; expiry: number }[];
    seasonal: number;
    location: number;
}

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
    location: Region;
    workLocation: Region;
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
    happiness: {
        total: number;
        factors: HappinessFactors;
        modifiers: HappinessModifiers;
    };
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
    location: Region;
    workLocation: Region;
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
    happiness: {
        total: number;
        factors: HappinessFactors;
        modifiers: HappinessModifiers;
    };
    private baseSalary: number;

    constructor(config?: PlayerConfig) {
        this.cash = config?.startingCash ?? GAME_DATA.config.startingCash;
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
        
        // Choose a random location from available regions
        const availableRegions = GAME_DATA.config.regions;
        this.location = availableRegions[Math.floor(Math.random() * availableRegions.length)];
        
        // Set work location to London
        this.workLocation = 'London';
        
        // Base expenses in 2005 prices (excluding rent which is calculated separately)
        this.baseExpenses = {
            utilities: 200,
            food: 300,
            transport: 100,
            entertainment: 200,
            other: 100
        };
        
        this.monthlyExpenses = { 
            utilities: 200,
            food: 300,
            transport: 100,
            entertainment: 200,
            other: 100,
            rent: 0 
        };
        
        // Store base salary for future calculations
        this.baseSalary = config?.baseSalary ?? 3000;
        this.monthlyIncome = this.calculateMonthlyIncome();
        
        this.jobLossMonths = 0;
        this.children = 0;
        this.lastMonthPrices = {};
        this.currentMonthPrices = {};
        this.dailyVolatility = 0.002;
        
        this.capitalGains = {
            currentTaxYear: 0,
            allowanceUsed: 0,
            taxPaid: 0
        };
        
        // Initialize stock prices
        this.initializeStockPrices();
        
        // Initialize starting rental property
        const baseRent = GAME_DATA.rentPrice[this.location][this.currentYear];
        this.housing = {
            id: `rental_${this.location}_start`,
            type: 'RENT',
            name: `One Bedroom Flat in ${this.location}`,
            location: this.location,
            price: 0,
            monthlyPayment: baseRent,
            size: 50,
            condition: 7,
            appreciationRate: 0
        };
        
        this.monthlyHousingPayment = baseRent;
        this.monthlyExpenses.rent = baseRent;

        // Update transport costs based on location
        this.updateTransportCosts();

        // Initialize happiness
        this.happiness = {
            total: 70,
            factors: {
                financial: 70,
                living: 70,
                workLife: 70,
                social: 70,
                health: 70
            },
            modifiers: {
                shortTerm: [],
                seasonal: 0,
                location: 0
            }
        };
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
        // Base income adjusted for inflation
        const currentYear = this.currentYear;
        const yearsSince2005 = currentYear - 2005;
        const inflationAdjustedIncome = this.baseSalary * Math.pow(1.02, yearsSince2005);

        // Career progression bonus (3% per year of experience)
        const experienceBonus = inflationAdjustedIncome * (yearsSince2005 * 0.03);

        // Calculate rental income from properties
        let rentalIncome = 0;
        for (const property of this.properties) {
            if (property.isRental && property.rentalIncome) {
                rentalIncome += property.rentalIncome;
            }
        }

        return Math.round(inflationAdjustedIncome + experienceBonus + rentalIncome);
    }

    calculateNetMonthlyIncome(): number {
        // Calculate base monthly income
        const baseMonthlyIncome = this.calculateMonthlyIncome();
        
        // Calculate rental income
        let rentalIncome = 0;
        let totalMortgagePayments = 0;
        for (const property of this.properties) {
            if (property.isRental && property.rentalIncome) {
                rentalIncome += property.rentalIncome;
            }
            if (property.monthlyPayment) {
                totalMortgagePayments += property.monthlyPayment;
            }
        }
        
        // Calculate savings interest
        const baseRate = GAME_DATA.interestRates[this.currentYear] || 0;
        const savingsRate = baseRate * 0.7; // Savings accounts typically offer less than base rate
        const monthlyRate = savingsRate / 100 / 12;
        const savingsInterest = this.savings * monthlyRate;
        
        // Calculate total gross monthly income
        const totalGrossMonthly = baseMonthlyIncome + rentalIncome + savingsInterest;
        
        // Calculate yearly income for tax purposes
        const projectedYearlyIncome = totalGrossMonthly * 12;
        
        // Calculate yearly tax and then monthly tax
        const yearlyTax = this.calculateIncomeTax(projectedYearlyIncome);
        const monthlyTax = yearlyTax / 12;
        
        // Calculate total monthly expenses
        const totalExpenses = this.getTotalExpenses();
        
        // Return net monthly income (after tax and expenses)
        return totalGrossMonthly - monthlyTax - totalExpenses - totalMortgagePayments;
    }

    calculateIncomeTax(yearlyIncome: number): number {
        const brackets = GAME_DATA.incomeTax[this.currentYear];
        const monthlyIncome = yearlyIncome / 12;
        const incomeSoFar = monthlyIncome * (this.currentMonth + 1);
        
        // Calculate tax on income so far this year
        let taxSoFar = 0;
        for (let i = 1; i < brackets.length; i++) {
            const currentBracket = brackets[i];
            const prevBracket = brackets[i - 1];
            
            if (incomeSoFar > prevBracket.threshold) {
                const amountInBracket = Math.min(
                    incomeSoFar - prevBracket.threshold,
                    (currentBracket.threshold - prevBracket.threshold) || Infinity
                );
                taxSoFar += amountInBracket * currentBracket.rate;
            }
        }
        
        return taxSoFar;
    }

    getTotalExpenses(): number {
        let total = 0;
        // Add all monthly expenses
        for (const category in this.monthlyExpenses) {
            total += this.monthlyExpenses[category as keyof MonthlyExpenses];
        }
        // Add mortgage payment if property is owned
        if (this.housing?.type === 'OWNED') {
            total += this.monthlyHousingPayment;
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

    updateTransportCosts(): void {
        // Get the transport multiplier for the current location
        const locationMultiplier = GAME_DATA.transportCostMultiplier[this.housing?.location || this.location];
        
        // Update transport costs based on location
        this.monthlyExpenses.transport = this.baseExpenses.transport * locationMultiplier;
    }

    adjustExpensesForInflation(): void {
        // Calculate cumulative inflation since 2005
        let cumulativeInflation = 1;
        for (let year = GAME_DATA.config.startYear; year <= this.currentYear; year++) {
            if (GAME_DATA.inflation[year]) {
                cumulativeInflation *= (1 + GAME_DATA.inflation[year] / 100);
            }
        }

        // Calculate seasonal utility multiplier (higher in winter months)
        const winterMonths = [0, 1, 2, 11]; // Jan, Feb, Mar, Dec
        const midSeasonMonths = [3, 4, 9, 10]; // Apr, May, Oct, Nov
        let seasonalUtilityMultiplier = 1;
        
        if (winterMonths.includes(this.currentMonth)) {
            seasonalUtilityMultiplier = 1.5; // 50% increase in winter
        } else if (midSeasonMonths.includes(this.currentMonth)) {
            seasonalUtilityMultiplier = 1.2; // 20% increase in spring/autumn
        }

        // Calculate property condition effect on utilities
        let conditionUtilityMultiplier = 1;
        if (this.housing) {
            // Poor condition (below 5) increases utility costs
            // Good condition (above 7) decreases utility costs
            const conditionEffect = (7 - this.housing.condition) * 0.1; // 10% change per point difference from 7
            conditionUtilityMultiplier = 1 + conditionEffect;
        }

        // Adjust each expense category for inflation and seasonal/condition effects
        for (const category in this.baseExpenses) {
            if (category === 'utilities') {
                this.monthlyExpenses[category] = 
                    this.baseExpenses[category] * 
                    cumulativeInflation * 
                    seasonalUtilityMultiplier * 
                    conditionUtilityMultiplier;
            } else if (category !== 'transport' && category !== 'rent') {
                this.monthlyExpenses[category as keyof Omit<MonthlyExpenses, 'rent' | 'transport'>] = 
                    this.baseExpenses[category as keyof Omit<MonthlyExpenses, 'rent' | 'transport'>] * 
                    cumulativeInflation;
            }
        }

        // Update transport costs using the original base cost
        this.updateTransportCosts();

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

    calculateHappiness(): void {
        // Calculate base factors
        this.calculateFinancialHappiness();
        this.calculateLivingHappiness();
        this.calculateWorkLifeHappiness();
        this.calculateSocialHappiness();
        this.calculateHealthHappiness();

        // Apply weights to base factors (adjusted to give health more importance)
        const weightedHappiness = 
            this.happiness.factors.financial * 0.25 +
            this.happiness.factors.living * 0.20 +
            this.happiness.factors.workLife * 0.15 +
            this.happiness.factors.social * 0.15 +
            this.happiness.factors.health * 0.25; // Increased from 0.1 to 0.25

        // Calculate total with modifiers
        const modifierSum = 
            this.calculateShortTermModifiers() +
            this.calculateSeasonalModifier() +
            this.calculateLocationModifier();

        // Update total happiness (keep between 0 and 100)
        this.happiness.total = Math.max(0, Math.min(100, weightedHappiness + modifierSum));
    }

    private calculateFinancialHappiness(): void {
        let score = 70; // Base score

        // Calculate regional average income based on house prices
        const londonPrice = GAME_DATA.housePrice['London'][this.currentYear] || 6600;
        const regionPrice = GAME_DATA.housePrice[this.location][this.currentYear] || 3000;
        
        // Use price ratios to determine regional average income
        // London base income is £3000 (from calculateMonthlyIncome)
        const londonBaseIncome = 3000;
        const regionalAverage = (regionPrice / londonPrice) * londonBaseIncome;

        // Income vs Regional Average
        const incomeRatio = this.calculateMonthlyIncome() / regionalAverage;
        score += (incomeRatio - 1) * 20;

        // Savings Buffer
        const monthlyExpenses = this.getTotalExpenses();
        const savingsMonths = monthlyExpenses > 0 ? this.savings / monthlyExpenses : 0;
        score += Math.min(savingsMonths * 5, 20); // Max +20 for 4+ months of savings

        // Debt-to-Income Ratio
        const monthlyDebt = this.loans.reduce((total, loan) => total + loan.monthlyPayment, 0);
        const debtRatio = monthlyDebt / this.calculateMonthlyIncome();
        score -= debtRatio * 50; // Higher debt ratio reduces happiness

        this.happiness.factors.financial = Math.max(0, Math.min(100, score));
    }

    private calculateLivingHappiness(): void {
        let score = 70;

        // Property condition
        if (this.housing) {
            score += (this.housing.condition - 5) * 5; // -25 to +25 based on condition
        }

        // Commute impact
        if (this.location !== this.workLocation) {
            score -= 15; // Penalty for long-distance commute
        }

        // Living costs vs income
        const livingCostRatio = this.getTotalExpenses() / this.calculateMonthlyIncome();
        score -= (livingCostRatio - 0.4) * 50; // Optimal ratio is 40% of income

        this.happiness.factors.living = Math.max(0, Math.min(100, score));
    }

    private calculateWorkLifeHappiness(): void {
        let score = 70;

        // Job security
        if (this.jobLossMonths > 0) {
            score -= 40;
        }

        // Commute stress
        if (this.location !== this.workLocation) {
            score -= 20;
        }

        // Career progression (based on years worked)
        const yearsWorked = this.currentYear - GAME_DATA.config.startYear;
        score += Math.min(yearsWorked * 2, 20); // Max +20 for 10+ years experience

        // Age-related work-life balance challenges
        if (this.age >= 35) {
            // Increased responsibilities and stress with age
            const workStress = (this.age - 35) * 0.4; // 0.4 points per year after 35
            score -= Math.min(workStress, 15); // Cap the reduction at 15 points

            // Recovery time needed increases with age
            if (this.age >= 45) {
                score -= (this.age - 45) * 0.3; // Additional 0.3 points per year after 45
            }
        }

        this.happiness.factors.workLife = Math.max(0, Math.min(100, score));
    }

    private calculateSocialHappiness(): void {
        let score = 70;

        // Marital status
        if (this.married) {
            score += 15;
        }

        // Children
        if (this.children > 0) {
            score += 10; // Joy of having children
            score -= Math.max(0, (this.children - 2) * 5); // Stress from many children
        }

        // Social activities (based on entertainment spending)
        const entertainmentRatio = this.monthlyExpenses.entertainment / this.calculateMonthlyIncome();
        score += entertainmentRatio * 100;

        // Age-related social changes
        if (this.age >= 30) {
            // Gradual decline in social connections and activities
            const socialDecline = (this.age - 30) * 0.25; // 0.25 points per year after 30
            
            // Partial offset if married or have children (family social support)
            const familyOffset = (this.married ? 0.1 : 0) + (this.children > 0 ? 0.1 : 0);
            const netDecline = socialDecline * (1 - familyOffset);
            
            score -= Math.min(netDecline, 20); // Cap the reduction at 20 points

            // Additional social isolation factor after retirement age (65)
            if (this.age >= 65) {
                score -= Math.min((this.age - 65) * 0.5, 15); // Up to 15 points reduction
            }
        }

        // Entertainment spending becomes less effective at improving social happiness with age
        if (this.age >= 40) {
            const entertainmentEffectiveness = Math.max(0.5, 1 - ((this.age - 40) * 0.02));
            score = score - (entertainmentRatio * 100 * (1 - entertainmentEffectiveness));
        }

        this.happiness.factors.social = Math.max(0, Math.min(100, score));
    }

    private calculateHealthHappiness(): void {
        let score = 70;

        // Insurance coverage (more impactful)
        if (this.insurance.health) {
            score += 20;
        } else {
            score -= 15;
        }

        // Other insurance types still matter but less
        if (this.insurance.home) score += 3;
        if (this.insurance.contents) score += 2;
        if (this.insurance.car) score += 3;

        // Living conditions impact on health
        if (this.housing) {
            if (this.housing.condition < 5) {
                score -= (5 - this.housing.condition) * 5;
            }
        }

        // Work-related health factors
        if (this.location !== this.workLocation) {
            score -= 10;
        }

        // Financial stress impact on health
        const monthlyExpenses = this.getTotalExpenses();
        const savingsMonths = monthlyExpenses > 0 ? this.savings / monthlyExpenses : 0;
        if (savingsMonths < 1) {
            score -= 10;
        }

        // Seasonal health impacts
        const winterMonths = [0, 1, 11];
        if (winterMonths.includes(this.currentMonth)) {
            score -= 5;
        }

        // Age-related health decline
        // Start gradual decline from age 30, accelerating after 50
        if (this.age >= 30) {
            const baseDecline = (this.age - 30) * 0.3; // 0.3 points per year after 30
            const acceleratedDecline = this.age > 50 ? (this.age - 50) * 0.5 : 0; // Additional 0.5 points per year after 50
            score -= (baseDecline + acceleratedDecline);
        }

        this.happiness.factors.health = Math.max(0, Math.min(100, score));
    }

    private calculateShortTermModifiers(): number {
        // Remove expired modifiers
        this.happiness.modifiers.shortTerm = this.happiness.modifiers.shortTerm.filter(
            mod => mod.expiry > this.currentDay + (this.currentMonth * 30) + (this.currentYear * 365)
        );

        // Sum remaining modifiers
        return this.happiness.modifiers.shortTerm.reduce((sum, mod) => sum + mod.value, 0);
    }

    private calculateSeasonalModifier(): number {
        const winterMonths = [0, 1, 11]; // Dec, Jan, Feb
        const summerMonths = [5, 6, 7]; // Jun, Jul, Aug

        if (winterMonths.includes(this.currentMonth)) {
            return -5; // Winter blues
        } else if (summerMonths.includes(this.currentMonth)) {
            return 5; // Summer boost
        }
        return 0;
    }

    private calculateLocationModifier(): number {
        const currentYear = this.currentYear;
        
        // Calculate average house price across all regions for the current year
        const regions = Object.keys(GAME_DATA.housePrice);
        const totalPrice = regions.reduce((sum, region) => 
            sum + (GAME_DATA.housePrice[region][currentYear] || 0), 0);
        const averagePrice = totalPrice / regions.length;
        
        // Get current region's price
        const regionPrice = GAME_DATA.housePrice[this.location][currentYear] || averagePrice;
        
        // Calculate facilities score based on price ratio
        const facilitiesRatio = regionPrice / averagePrice;
        
        // Calculate base modifier (-10 to +10)
        let modifier = (facilitiesRatio - 1) * 15;
        
        // Additional London-specific modifiers
        if (this.location === 'London') {
            // Cultural and career opportunities boost
            modifier += 5;
            
            // But also stress factors if income isn't high enough
            const londonStressThreshold = 5000; // Monthly income needed to comfortably live in London
            if (this.calculateMonthlyIncome() < londonStressThreshold) {
                modifier -= 10; // High cost of living stress
            }
        }
        
        // Commute penalty for expensive areas
        if (this.location !== this.workLocation && facilitiesRatio > 1) {
            modifier -= 5; // Extra stress from expensive commuter area
        }
        
        // Cap the modifier between -15 and +15
        return Math.max(-15, Math.min(15, modifier));
    }

    addShortTermHappinessModifier(value: number, durationInDays: number): void {
        const expiry = this.currentDay + (this.currentMonth * 30) + (this.currentYear * 365) + durationInDays;
        this.happiness.modifiers.shortTerm.push({ value, expiry });
    }
}

export const createPlayer = (name: string): Player => {
    // Create default config with medium difficulty settings
    const defaultConfig: PlayerConfig = {
        startingCash: 15000, // Medium difficulty default
        baseSalary: 3000     // Medium difficulty default
    };
    return new Player(defaultConfig);
}; 