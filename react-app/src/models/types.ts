import { Region } from '../data/gameData';

// Game State Enum
export enum GameState {
    PAUSED = 'paused',
    RUNNING = 'running',
    FAST = 'fast',
    ENDED = 'ended'
}

// Stock type
export interface Stock {
    shares: number;
    avgBuyPrice: number;
}

// Property type
export interface Property {
    id: string;
    location: string;
    size: number;
    purchasePrice: number;
    purchaseDate: {
        year: number;
        month: number;
    };
    isRental: boolean;
    rentalIncome?: number;
    value?: number;
}

// Loan type
export interface Loan {
    id: string;
    amount: number;
    interestRate: number;
    term: number; // in months
    remainingAmount: number;
    monthlyPayment: number;
    startDate: {
        year: number;
        month: number;
    };
    type: 'mortgage' | 'personal' | 'car' | 'student';
}

// Car type
export interface Car {
    make: string;
    model: string;
    purchasePrice: number;
    purchaseDate: {
        year: number;
        month: number;
    };
    value: number;
}

// Insurance type
export interface Insurance {
    health: boolean;
    home: boolean;
    car: boolean;
    contents: boolean;
}

// Monthly expenses type
export interface MonthlyExpenses {
    rent: number;
    utilities: number;
    food: number;
    transport: number;
    entertainment: number;
    other: number;
}

// Capital Gains type
export interface CapitalGains {
    currentTaxYear: number;
    previousTaxYear: number;
    allowanceUsed: number;
    taxPaid: number;
}

// Player type
export interface Player {
    cash: number;
    age: number;
    currentYear: number;
    currentMonth: number;
    currentDay: number;
    stocks: Record<string, Stock>;
    properties: Property[];
    savings: number;
    loans: Loan[];
    married: boolean;
    car: Car | null;
    insurance: Insurance;
    location: Region;
    baseExpenses: Omit<MonthlyExpenses, 'rent'>;
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

// Event History Item type
export interface EventHistoryItem {
    date: string;
    event: string;
    message: string;
}

// News Event type
export interface NewsEvent {
    date: {
        year: number;
        month: number;
    };
    title: string;
    content: string;
}

// Random Event Effect Return type
export interface RandomEventEffect {
    message: string;
    cashChange?: number;
    jobLoss?: number;
    marketCrash?: boolean;
    divorce?: boolean;
    childExpense?: number;
    propertyEffect?: {
        id: string;
        conditionChange: number;
    };
}

// Random Event type
export interface RandomEvent {
    id: string;
    name: string;
    description: string;
    probability: number;
    effect: (player: Player) => RandomEventEffect | null;
}

// Game Data Configuration type
export interface GameDataConfig {
    startYear: number;
    startMonth: number;
    startAge: number;
    endAge: number;
    startingCash: number;
    timePerMonth: number;
    fastTimePerMonth: number;
    monthNames: string[];
    regions: string[];
}

export interface Housing {
    id: string;
    type: 'OWNED' | 'RENT';
    name: string;
    location: Region;
    price: number;
    monthlyPayment: number;
    size: number;
    condition: number;
    appreciationRate: number;
    propertyTax?: number;
    mortgageRate?: number;
    mortgageTermYears?: number;
    downPayment?: number;
    isRental?: boolean;
    rentalIncome?: number;
    purchaseYear?: number;
    securityDeposit?: number;
    rentalStartDate?: {
        year: number;
        month: number;
    };
}

export interface HousingMarket {
    availableHouses: Housing[];
    rentals: Housing[];
} 