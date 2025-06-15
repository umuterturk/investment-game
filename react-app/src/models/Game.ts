import { Player } from './Player';
import { GameState, EventHistoryItem, NewsEvent, RandomEventEffect, Housing, HousingMarket } from './types';
import { GAME_DATA, getInterestRateForYearMonth } from '../data/gameData';
import { NEWS_EVENTS } from '../data/newsData';
import { GameDifficulty } from '../components/WelcomeScreen';

interface GameNotification {
    message: string;
    timestamp: string;
}

export class Game {
    player: Player;
    gameState: GameState;
    previousGameState: GameState | null;
    timePerDay: number;
    notifications: GameNotification[];
    eventHistory: EventHistoryItem[];
    shownNews: string[];
    gameInterval: NodeJS.Timeout | null;
    soundEnabled: boolean;
    savedGames: { name: string, date: string, data: string }[];
    housingMarket: HousingMarket;
    private _lastHappiness: number = 70;
    difficulty: GameDifficulty | null = null;

    constructor() {
        console.log("Creating new Game instance");
        this.player = new Player();
        this.gameState = GameState.PAUSED;
        this.previousGameState = null;
        this.timePerDay = GAME_DATA.config.timePerMonth / 30; // Time per day in milliseconds
        this.notifications = [];
        this.eventHistory = [];
        this.shownNews = [];
        this.gameInterval = null;
        this.soundEnabled = true;
        this.loadSoundSetting();
        this.savedGames = this.getSavedGames();
        this.housingMarket = this.generateInitialHousingMarket();
    }

    setGameState(newState: GameState): void {
        // Clear any existing interval
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        this.gameState = newState;
        
        switch (newState) {
            case GameState.PAUSED:
                break;
            case GameState.RUNNING:
                this.gameInterval = setInterval(() => this.update(), this.timePerDay);
                break;
            case GameState.FAST:
                this.gameInterval = setInterval(() => this.update(), this.timePerDay / 3);
                break;
            case GameState.ENDED:
                this.endGame();
                break;
        }
        
        // Save game state
        this.saveGame();
    }

    update(): void {
        // Process daily updates
        this.updatePrices();
        this.processDailyExpenses();
        
        // Update happiness
        this.player.calculateHappiness();
        this.checkHappinessEvents();
        
        // Process monthly updates on the first day of the month
        if (this.player.currentDay === 1) {
            this.processRentTransactions();
            this.processMonthlyIncome();
            this.processSavingsInterest();
            this.processLoans();
            this.player.adjustExpensesForInflation();
            
            // Check for news events
            this.checkForNews();
            
            // Process random events (only personal events, not historical ones)
            this.processRandomEvents();
        }
        
        // Process yearly updates on January 1st
        if (this.player.currentMonth === 0 && this.player.currentDay === 1) {
            this.processYearEnd();
        }
        
        // Advance time
        this.advanceTime();
        
        // Save game
        this.saveGame();
    }

    updatePrices(): void {
        // Update stock prices
        for (const symbol in this.player.stocks) {
            // Get current price for this stock
            this.player.getCurrentStockPrice(symbol);
        }
        
        // Update property values
        for (const property of this.player.properties) {
            property.value = this.player.getCurrentPropertyValue(property);
        }
    }

    advanceTime(): void {
        // Advance to the next day
        this.player.currentDay++;
        
        // Check if we need to advance to the next month
        const daysInMonth = this.player.getDaysInMonth(this.player.currentMonth, this.player.currentYear);
        if (this.player.currentDay > daysInMonth) {
            this.player.currentDay = 1;
            this.player.currentMonth++;
            
            // Check if we need to advance to the next year
            if (this.player.currentMonth > 11) {
                this.player.currentMonth = 0;
                this.player.currentYear++;
                this.player.age++;
                
                // Check if the player has reached the end age
                if (this.player.age >= GAME_DATA.config.endAge) {
                    this.setGameState(GameState.ENDED);
                    return;
                }
            }
            
            // Process capital gains tax at the start of the new tax year (April)
            if (this.player.currentMonth === 3 && this.player.currentDay === 1) {
                this.processCapitalGainsTax();
            }
        }
    }

    processDailyExpenses(): void {
        // Calculate daily expenses (monthly expenses divided by days in month, excluding rent)
        const daysInMonth = this.player.getDaysInMonth(this.player.currentMonth, this.player.currentYear);
        const monthlyExpensesWithoutRent = {
            ...this.player.monthlyExpenses,
            rent: 0 // Exclude rent as it's handled separately
        };
        const dailyExpenses = Object.values(monthlyExpensesWithoutRent).reduce((a, b) => a + b, 0) / daysInMonth;
        
        // Deduct daily expenses from cash
        this.player.cash -= dailyExpenses;
        
        // Check if player is bankrupt
        if (this.player.cash < -10000) {
            this.addNotification("You're deeply in debt! Consider taking out a loan or selling assets.");
        }
    }

    processMonthlyIncome(): void {
        // Skip if player has job loss months remaining
        if (this.player.jobLossMonths > 0) {
            this.player.jobLossMonths--;
            this.addNotification(`You're still unemployed. ${this.player.jobLossMonths} months remaining until you find a new job.`);
            return;
        }
        
        // Calculate monthly income based on current year
        const grossMonthlyIncome = this.player.calculateMonthlyIncome();
        
        // Calculate yearly income for tax purposes (including rental income)
        const projectedYearlyIncome = grossMonthlyIncome * 12;
        
        // Calculate tax for this month (annualized for consistent interface)
        const annualizedTax = this.player.calculateIncomeTax(projectedYearlyIncome);
        const monthlyTax = annualizedTax / 12;
        
        // Calculate net monthly income
        const netMonthlyIncome = grossMonthlyIncome - monthlyTax;
        
        // Store gross monthly income
        this.player.monthlyIncome = grossMonthlyIncome;
        
        // Add notification with tax details
        this.addNotification(
            `Monthly Income Summary:\n` +
            `Gross Income: £${grossMonthlyIncome.toFixed(2)}\n` +
            `Income Tax: £${monthlyTax.toFixed(2)}\n` +
            `Net Income: £${netMonthlyIncome.toFixed(2)}`
        );
        
        // Add net income to cash
        this.player.cash += netMonthlyIncome;
    }

    processSavingsInterest(): void {
        // Skip if no savings
        if (this.player.savings <= 0) {
            return;
        }
        
        // Get current interest rate
        const baseRate = getInterestRateForYearMonth(this.player.currentYear, this.player.currentMonth);
        const savingsRate = baseRate * 0.7; // Savings accounts typically offer less than base rate
        
        // Calculate monthly interest
        const monthlyRate = savingsRate / 100 / 12;
        const interest = this.player.savings * monthlyRate;
        
        // Add interest to savings
        this.player.savings += interest;
        
        // Add notification
        this.addNotification(`You earned £${interest.toFixed(2)} in savings interest.`);
    }

    processLoans(): void {
        // Process each loan
        for (let i = this.player.loans.length - 1; i >= 0; i--) {
            const loan = this.player.loans[i];
            
            // Deduct monthly payment from cash
            this.player.cash -= loan.monthlyPayment;
            
            // Calculate interest and principal portions
            const monthlyInterestRate = loan.interestRate / 100 / 12;
            const interestPortion = loan.remainingAmount * monthlyInterestRate;
            const principalPortion = loan.monthlyPayment - interestPortion;
            
            // Update remaining amount
            loan.remainingAmount -= principalPortion;
            
            // Check if loan is paid off
            if (loan.remainingAmount <= 0) {
                this.addNotification(`You've paid off your ${loan.type} loan!`);
                this.player.loans.splice(i, 1);
            }
        }
    }

    processRandomEvents(): void {
        // Process random events
        for (const event of GAME_DATA.events) {
            // Check probability
            if (Math.random() < event.probability) {
                // Execute event effect
                const effect = event.effect(this.player);
                
                // Skip if no effect (e.g., conditions not met)
                if (!effect) {
                    continue;
                }
                
                // Apply effect - use type assertion to handle the union type
                const eventEffect = effect as RandomEventEffect;
                
                if ('cashChange' in eventEffect && eventEffect.cashChange) {
                    this.player.cash += eventEffect.cashChange;
                }
                
                if ('jobLoss' in eventEffect && eventEffect.jobLoss) {
                    this.player.jobLossMonths = eventEffect.jobLoss;
                }
                
                if ('marketCrash' in eventEffect && eventEffect.marketCrash) {
                    this.processMarketCrash();
                }
                
                if ('divorce' in eventEffect && eventEffect.divorce) {
                    this.processDivorce();
                }
                
                if ('childExpense' in eventEffect && eventEffect.childExpense) {
                    this.player.children++;
                    this.player.monthlyExpenses.other += eventEffect.childExpense;
                }

                if ('propertyEffect' in eventEffect && eventEffect.propertyEffect) {
                    // Find the affected property
                    const property = this.player.properties.find(p => p.id === eventEffect.propertyEffect?.id);
                    if (property) {
                        // Apply condition change
                        property.condition = Math.max(1, Math.min(10, property.condition + eventEffect.propertyEffect.conditionChange));
                    }
                }
                
                // Add notification
                this.addNotification(eventEffect.message);
                
                // Add to event history
                this.eventHistory.push({
                    date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
                    event: event.name,
                    message: eventEffect.message
                });
                
                // Only process one random event per month
                break;
            }
        }
    }

    processMarketCrash(): void {
        // Reduce stock prices by 20-40%
        for (const symbol in this.player.stocks) {
            const currentPrice = this.player.getCurrentStockPrice(symbol);
            const crashFactor = 0.6 + Math.random() * 0.2; // 60-80% of original value
            this.player.currentMonthPrices[symbol] = currentPrice * crashFactor;
        }
    }

    processDivorce(): void {
        // Player loses half of all assets
        this.player.cash /= 2;
        this.player.savings /= 2;
        
        // Set married status to false
        this.player.married = false;
        
        // Update rent (will be higher now as single)
        this.player.updateRent();
        
        // Add event to history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Divorce',
            message: 'Your marriage has ended in divorce. Half of your assets have been divided.'
        });
    }

    processCapitalGainsTax(): void {
        const taxDue = this.player.calculateCapitalGainsTax();
        
        if (taxDue > 0) {
            // Deduct tax from cash
            this.player.cash -= taxDue;
            
            // Record tax paid
            this.player.capitalGains.taxPaid += taxDue;
            
            // Add notification
            this.addNotification(`Paid £${taxDue.toFixed(2)} in capital gains tax for the tax year.`);
            
            // Reset for new tax year
            this.player.capitalGains.currentTaxYear = 0;
            this.player.capitalGains.allowanceUsed = 0;
        } else if (this.player.capitalGains.currentTaxYear > 0) {
            // No tax due but there were gains
            this.addNotification(`No capital gains tax due as your gains of £${this.player.capitalGains.currentTaxYear.toFixed(2)} are within the annual allowance.`);
            
            // Reset for new tax year
            this.player.capitalGains.currentTaxYear = 0;
            this.player.capitalGains.allowanceUsed = 0;
        } else {
            // No capital gains during the tax year
            this.addNotification(`Tax year ended with no capital gains to report.`);
        }
    }

    addNotification(message: string): void {
        const timestamp = this.formatGameTime();
        // Add to the beginning of the array (newest first)
        this.notifications.unshift({ message, timestamp });
        
        // Keep only the last 20 notifications
        if (this.notifications.length > 20) {
            this.notifications.pop(); // Remove from the end
        }
    }

    private formatGameTime(): string {
        const startYear = GAME_DATA.config.startYear;
        const yearsPlayed = this.player.currentYear - startYear;
        return `${yearsPlayed}y ${this.player.currentMonth}m ${this.player.currentDay}d`;
    }

    checkForNews(): NewsEvent | null {
        const currentYear = this.player.currentYear;
        const currentMonth = this.player.currentMonth;
        
        // Check for news events
        for (const newsEvent of NEWS_EVENTS) {
            if (newsEvent.date.year === currentYear && newsEvent.date.month === currentMonth) {
                // Check if this news has already been shown
                const newsId = `${newsEvent.date.year}-${newsEvent.date.month}-${newsEvent.title}`;
                if (!this.shownNews.includes(newsId)) {
                    // Add to shown news
                    this.shownNews.push(newsId);
                    
                    // Add to game notifications
                    this.addNotification(`NEWS: ${newsEvent.title}`);
                    
                    // Add to event history
                    this.eventHistory.push({
                        date: `${GAME_DATA.config.monthNames[currentMonth]} ${currentYear}`,
                        event: 'News',
                        message: newsEvent.title
                    });
                    
                    // Return the news event to be displayed
                    return newsEvent;
                }
            }
        }
        
        return null;
    }

    saveGame(): void {
        console.log("Saving game...");
        
        // Ensure player data is up to date
        this.player.updateRent();
        this.player.adjustExpensesForInflation();
        
        // Save game state to localStorage
        const gameData = {
            player: {
                // Core properties
                age: this.player.age,
                cash: this.player.cash,
                savings: this.player.savings,
                currentDay: this.player.currentDay,
                currentMonth: this.player.currentMonth,
                currentYear: this.player.currentYear,
                monthlyIncome: this.player.monthlyIncome,
                married: this.player.married,
                children: this.player.children,
                jobLossMonths: this.player.jobLossMonths,
                location: this.player.location,
                
                // Complex properties
                stocks: this.player.stocks,
                properties: this.player.properties,
                loans: this.player.loans,
                car: this.player.car,
                insurance: this.player.insurance,
                capitalGains: this.player.capitalGains,
                baseExpenses: this.player.baseExpenses,
                monthlyExpenses: this.player.monthlyExpenses,
                housing: this.player.housing,
                monthlyHousingPayment: this.player.monthlyHousingPayment,
                
                // Price history
                lastMonthPrices: this.player.lastMonthPrices,
                currentMonthPrices: this.player.currentMonthPrices,
                dailyVolatility: this.player.dailyVolatility
            },
            gameState: this.gameState,
            previousGameState: this.previousGameState,
            notifications: this.notifications,
            eventHistory: this.eventHistory,
            shownNews: this.shownNews,
            saveDate: new Date().toLocaleString(),
            difficulty: this.difficulty
        };
        
        try {
            localStorage.setItem('investmentGameSave', JSON.stringify(gameData));
            console.log("Game saved successfully:", {
                day: this.player.currentDay,
                month: this.player.currentMonth,
                year: this.player.currentYear,
                cash: this.player.cash
            });
        } catch (error) {
            console.error("Error saving game:", error);
        }
        
        // Update saved games list
        this.savedGames = this.getSavedGames();
    }

    loadGame(): boolean {
        // Load game state from localStorage
        console.log("Loading autosave game...");
        return this.loadGameByName('Autosave');
    }

    endGame(): void {
        // Calculate final net worth
        const finalNetWorth = this.player.getNetWorth();
        
        // Add notification
        this.addNotification(`Game Over! You've reached age ${this.player.age} with a final net worth of £${finalNetWorth.toFixed(2)}.`);
        
        // Set game state to ended
        this.gameState = GameState.ENDED;
        
        // Save final game state
        this.saveGame();
    }

    restartGame(): void {
        // Create a new player
        this.player = new Player();
        
        // Reset game state
        this.gameState = GameState.PAUSED;
        this.previousGameState = null;
        this.notifications = [];
        this.eventHistory = [];
        this.shownNews = [];
        
        // Save new game state
        this.saveGame();
    }

    // Stock methods
    buyStock(symbol: string, quantity: number): boolean {
        // Get current price
        const currentPrice = this.player.getCurrentStockPrice(symbol);
        
        // Calculate total cost
        const totalCost = currentPrice * quantity;
        
        // Check if player has enough cash
        if (this.player.cash < totalCost) {
            this.addNotification(`You don't have enough cash to buy ${quantity} shares of ${symbol}.`);
            return false;
        }
        
        // Update player's stocks
        if (!this.player.stocks[symbol]) {
            this.player.stocks[symbol] = {
                shares: quantity,
                avgBuyPrice: currentPrice
            };
        } else {
            // Calculate new average buy price
            const currentShares = this.player.stocks[symbol].shares;
            const currentAvgPrice = this.player.stocks[symbol].avgBuyPrice;
            const newTotalShares = currentShares + quantity;
            const newAvgPrice = (currentShares * currentAvgPrice + quantity * currentPrice) / newTotalShares;
            
            // Update stock data
            this.player.stocks[symbol].shares = newTotalShares;
            this.player.stocks[symbol].avgBuyPrice = newAvgPrice;
        }
        
        // Deduct cost from cash
        this.player.cash -= totalCost;
        
        // Add notification
        this.addNotification(`Bought ${quantity} shares of ${symbol} at £${currentPrice.toFixed(2)} per share.`);
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Stock Purchase',
            message: `Bought ${quantity} shares of ${symbol} at £${currentPrice.toFixed(2)} per share.`
        });
        
        return true;
    }

    sellStock(symbol: string, quantity: number): boolean {
        // Check if player owns the stock
        if (!this.player.stocks[symbol] || this.player.stocks[symbol].shares < quantity) {
            this.addNotification(`You don't own ${quantity} shares of ${symbol}.`);
            return false;
        }
        
        // Get current price
        const currentPrice = this.player.getCurrentStockPrice(symbol);
        
        // Calculate total sale value
        const totalValue = currentPrice * quantity;
        
        // Calculate capital gain/loss
        const originalCost = this.player.stocks[symbol].avgBuyPrice * quantity;
        const capitalGain = totalValue - originalCost;
        
        // Add capital gain to tax tracking
        if (capitalGain > 0) {
            this.player.capitalGains.currentTaxYear += capitalGain;
        }
        
        // Update player's stocks
        this.player.stocks[symbol].shares -= quantity;
        
        // Remove stock if no shares left
        if (this.player.stocks[symbol].shares === 0) {
            delete this.player.stocks[symbol];
        }
        
        // Add value to cash
        this.player.cash += totalValue;
        
        // Add notification
        this.addNotification(`Sold ${quantity} shares of ${symbol} at £${currentPrice.toFixed(2)} per share.`);
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Stock Sale',
            message: `Sold ${quantity} shares of ${symbol} at £${currentPrice.toFixed(2)} per share.`
        });
        
        return true;
    }

    // Property methods
    buyProperty(property: any): boolean {
        // Check if player has enough cash
        if (this.player.cash < property.purchasePrice) {
            this.addNotification(`You don't have enough cash to buy this property.`);
            return false;
        }
        
        // Add property to player's properties
        this.player.properties.push(property);
        
        // Deduct cost from cash
        this.player.cash -= property.purchasePrice;
        
        // Update rent if this is a primary residence
        if (!property.isRental) {
            this.player.updateRent();
        }
        
        // Add notification
        this.addNotification(`Bought a ${property.size}sqm property in ${property.location} for £${property.purchasePrice.toFixed(2)}.`);
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Property Purchase',
            message: `Bought a ${property.size}sqm property in ${property.location} for £${property.purchasePrice.toFixed(2)}.`
        });
        
        return true;
    }

    sellProperty(propertyIndex: number): boolean {
        // Check if property exists
        if (propertyIndex < 0 || propertyIndex >= this.player.properties.length) {
            this.addNotification(`Invalid property selection.`);
            return false;
        }
        
        const property = this.player.properties[propertyIndex];
        const currentValue = this.player.getCurrentPropertyValue(property);
        
        // Calculate capital gain/loss
        const capitalGain = currentValue - property.purchasePrice;
        
        // Add capital gain to tax tracking
        if (capitalGain > 0) {
            this.player.capitalGains.currentTaxYear += capitalGain;
        }
        
        // Add value to cash
        this.player.cash += currentValue;
        
        // Remove property
        this.player.properties.splice(propertyIndex, 1);
        
        // Update rent if this was a primary residence
        if (!property.isRental) {
            this.player.updateRent();
        }
        
        // Add notification
        this.addNotification(`Sold your property in ${property.location} for £${currentValue.toFixed(2)}.`);
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Property Sale',
            message: `Sold your property in ${property.location} for £${currentValue.toFixed(2)}.`
        });
        
        return true;
    }

    // Savings methods
    deposit(amount: number): boolean {
        // Check if player has enough cash
        if (this.player.cash < amount) {
            this.addNotification(`You don't have enough cash to deposit £${amount.toFixed(2)}.`);
            return false;
        }
        
        // Transfer from cash to savings
        this.player.cash -= amount;
        this.player.savings += amount;
        
        // Add notification
        this.addNotification(`Deposited £${amount.toFixed(2)} into your savings account.`);
        
        return true;
    }

    withdraw(amount: number): boolean {
        // Check if player has enough savings
        if (this.player.savings < amount) {
            this.addNotification(`You don't have enough savings to withdraw £${amount.toFixed(2)}.`);
            return false;
        }
        
        // Transfer from savings to cash
        this.player.savings -= amount;
        this.player.cash += amount;
        
        // Add notification
        this.addNotification(`Withdrew £${amount.toFixed(2)} from your savings account.`);
        
        return true;
    }

    // Marriage method
    processMarriage(): boolean {
        // Check if already married
        if (this.player.married) {
            this.addNotification(`You're already married!`);
            return false;
        }
        
        // Set married status
        this.player.married = true;
        
        // Adjust expenses
        this.player.updateRent();
        
        // Add cash bonus (representing spouse's assets)
        const spouseAssets = this.player.monthlyIncome * 12;
        this.player.cash += spouseAssets;
        
        // Add notification
        this.addNotification(`Congratulations on your marriage! Your spouse brings £${spouseAssets.toFixed(2)} in assets.`);
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Marriage',
            message: `You got married!`
        });
        
        return true;
    }

    // Car methods
    buyCar(car: any): boolean {
        // Check if player has enough cash
        if (this.player.cash < car.purchasePrice) {
            this.addNotification(`You don't have enough cash to buy this car.`);
            return false;
        }
        
        // Sell existing car if any
        if (this.player.car) {
            this.sellCar();
        }
        
        // Set new car
        this.player.car = car;
        
        // Deduct cost from cash
        this.player.cash -= car.purchasePrice;
        
        // Add notification
        this.addNotification(`Bought a ${car.make} ${car.model} for £${car.purchasePrice.toFixed(2)}.`);
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Car Purchase',
            message: `Bought a ${car.make} ${car.model} for £${car.purchasePrice.toFixed(2)}.`
        });
        
        return true;
    }

    sellCar(): boolean {
        // Check if player has a car
        if (!this.player.car) {
            this.addNotification(`You don't have a car to sell.`);
            return false;
        }
        
        // Calculate current value (cars depreciate)
        const currentValue = this.player.car.value;
        
        // Add value to cash
        this.player.cash += currentValue;
        
        // Add notification
        this.addNotification(`Sold your ${this.player.car.make} ${this.player.car.model} for £${currentValue.toFixed(2)}.`);
        
        // Remove car
        this.player.car = null;
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Car Sale',
            message: `Sold your car for £${currentValue.toFixed(2)}.`
        });
        
        return true;
    }

    // Loan methods
    takeLoan(loan: any): boolean {
        // Add loan to player's loans
        this.player.loans.push(loan);
        
        // Add loan amount to cash
        this.player.cash += loan.amount;
        
        // Add notification
        this.addNotification(`Took out a ${loan.type} loan for £${loan.amount.toFixed(2)}.`);
        
        // Add to event history
        this.eventHistory.push({
            date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
            event: 'Loan',
            message: `Took out a ${loan.type} loan for £${loan.amount.toFixed(2)}.`
        });
        
        return true;
    }

    // Insurance methods
    buyInsurance(type: keyof Player['insurance'], cost: number): boolean {
        // Check if player has enough cash
        if (this.player.cash < cost) {
            this.addNotification(`You don't have enough cash to buy ${type} insurance.`);
            return false;
        }
        
        // Set insurance status
        this.player.insurance[type] = true;
        
        // Deduct cost from cash
        this.player.cash -= cost;
        
        // Add notification
        this.addNotification(`Purchased ${type} insurance for £${cost.toFixed(2)}.`);
        
        return true;
    }

    cancelInsurance(type: keyof Player['insurance']): void {
        // Set insurance status
        this.player.insurance[type] = false;
        
        // Add notification
        this.addNotification(`Cancelled your ${type} insurance.`);
    }

    // Sound settings
    toggleSound(): void {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('investmentGameSoundEnabled', JSON.stringify(this.soundEnabled));
    }

    // Get sound setting from localStorage
    loadSoundSetting(): void {
        const soundSetting = localStorage.getItem('investmentGameSoundEnabled');
        if (soundSetting !== null) {
            this.soundEnabled = JSON.parse(soundSetting);
        }
    }

    // Play sound if enabled
    playSound(soundType: string): void {
        if (!this.soundEnabled) return;
        
        // Sound implementation would go here
        console.log(`Playing sound: ${soundType}`);
        // Example: new Audio(`/sounds/${soundType}.mp3`).play();
    }

    // Saved games management
    getSavedGames(): { name: string, date: string, data: string }[] {
        const savedGames: { name: string, date: string, data: string }[] = [];
        
        // Get default autosave
        const autosave = localStorage.getItem('investmentGameSave');
        if (autosave) {
            try {
                const gameData = JSON.parse(autosave);
                const saveDate = gameData.saveDate || new Date().toLocaleString();
                
                savedGames.push({
                    name: 'Autosave',
                    date: saveDate,
                    data: autosave
                });
            } catch (error) {
                console.error('Error parsing autosave data:', error);
                savedGames.push({
                    name: 'Autosave',
                    date: new Date().toLocaleString(),
                    data: autosave
                });
            }
        }
        
        // Get named saves
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('investmentGameSave_')) {
                const name = key.replace('investmentGameSave_', '');
                const saveData = localStorage.getItem(key);
                if (saveData) {
                    try {
                        const gameData = JSON.parse(saveData);
                        const saveDate = gameData.saveDate || new Date().toLocaleString();
                        
                        savedGames.push({
                            name: name,
                            date: saveDate,
                            data: saveData
                        });
                    } catch (error) {
                        console.error(`Error parsing save data for ${name}:`, error);
                    }
                }
            }
        }
        
        return savedGames;
    }

    // Save game with name
    saveGameAs(name: string): void {
        // Create a copy of the game state to save
        const gameState = {
            gameState: this.gameState,
            player: this.player,
            notifications: this.notifications,
            eventHistory: this.eventHistory,
            shownNews: this.shownNews,
            saveDate: new Date().toLocaleString(),
            difficulty: this.difficulty // Save difficulty
        };
        
        // Save to localStorage
        localStorage.setItem(`investmentGameSave_${name}`, JSON.stringify(gameState));
        
        // Update saved games list
        this.savedGames = this.getSavedGames();
        
        // Add notification
        this.addNotification(`Game saved as "${name}"`);
    }

    // Load specific saved game
    loadGameByName(name: string): boolean {
        console.log(`Loading game: ${name}`);
        let saveData;
        
        if (name === 'Autosave') {
            saveData = localStorage.getItem('investmentGameSave');
        } else {
            saveData = localStorage.getItem(`investmentGameSave_${name}`);
        }
        
        if (!saveData) {
            console.error(`No save data found for ${name}`);
            return false;
        }
        
        try {
            console.log("Parsing save data...");
            const gameData = JSON.parse(saveData);
            console.log("Save data parsed:", { 
                gameState: gameData.gameState,
                playerData: gameData.player ? "exists" : "missing",
                cash: gameData.player?.cash,
                currentDay: gameData.player?.currentDay,
                currentMonth: gameData.player?.currentMonth,
                currentYear: gameData.player?.currentYear,
                difficulty: gameData.difficulty
            });
            
            // Restore difficulty first - CRITICAL for UI to show game screen
            if (gameData.difficulty) {
                console.log("Restoring difficulty:", gameData.difficulty);
                this.difficulty = gameData.difficulty;
            } else {
                console.warn("No difficulty found in saved game, setting to 'medium'");
                this.difficulty = 'medium'; // Default to medium if not found
            }

            // Restore player data
            if (gameData.player) {
                console.log("Restoring player data...");
                
                // Create a new player with the correct starting values based on difficulty
                // but don't initialize with default values
                this.player = new Player({
                    startingCash: gameData.player.cash || 0,
                    baseSalary: gameData.player.monthlyIncome || 3000
                });
                
                // Now restore all player properties from saved data
                this.player.cash = gameData.player.cash || 0;
                this.player.age = gameData.player.age || 25;
                this.player.currentYear = gameData.player.currentYear || 2005;
                this.player.currentMonth = gameData.player.currentMonth || 1;
                this.player.currentDay = gameData.player.currentDay || 1;
                
                // Restore complex properties
                this.player.stocks = gameData.player.stocks || {};
                this.player.properties = gameData.player.properties || [];
                this.player.savings = gameData.player.savings || 0;
                this.player.loans = gameData.player.loans || [];
                this.player.married = gameData.player.married || false;
                this.player.children = gameData.player.children || 0;
                this.player.jobLossMonths = gameData.player.jobLossMonths || 0;
                this.player.location = gameData.player.location || 'London';
                this.player.workLocation = gameData.player.workLocation || 'London';
                this.player.monthlyIncome = gameData.player.monthlyIncome || 3000;
                
                // Restore car if exists
                if (gameData.player.car) {
                    this.player.car = {...gameData.player.car};
                }
                
                // Restore insurance
                if (gameData.player.insurance) {
                    this.player.insurance = {...gameData.player.insurance};
                }
                
                // Restore capital gains
                if (gameData.player.capitalGains) {
                    this.player.capitalGains = {...gameData.player.capitalGains};
                }
                
                // Restore expenses
                if (gameData.player.baseExpenses) {
                    this.player.baseExpenses = {...gameData.player.baseExpenses};
                }
                
                if (gameData.player.monthlyExpenses) {
                    this.player.monthlyExpenses = {...gameData.player.monthlyExpenses};
                }
                
                // Restore housing
                if (gameData.player.housing) {
                    this.player.housing = gameData.player.housing;
                }

                if (gameData.player.monthlyHousingPayment !== undefined) {
                    this.player.monthlyHousingPayment = gameData.player.monthlyHousingPayment;
                }
                
                // Restore price history
                if (gameData.player.lastMonthPrices) {
                    this.player.lastMonthPrices = {...gameData.player.lastMonthPrices};
                }
                
                if (gameData.player.currentMonthPrices) {
                    this.player.currentMonthPrices = {...gameData.player.currentMonthPrices};
                }
                
                // Restore volatility
                if (gameData.player.dailyVolatility) {
                    this.player.dailyVolatility = gameData.player.dailyVolatility;
                }
                
                // Restore happiness
                if (gameData.player.happiness) {
                    this.player.happiness = {...gameData.player.happiness};
                }
                
                console.log("Player data restored:", {
                    cash: this.player.cash,
                    currentDay: this.player.currentDay,
                    currentMonth: this.player.currentMonth,
                    currentYear: this.player.currentYear
                });
            }
            
            // Restore game state
            this.gameState = gameData.gameState ?? GameState.PAUSED;
            
            // Restore previous game state if available
            if (gameData.previousGameState) {
                this.previousGameState = gameData.previousGameState;
            }
            
            this.notifications = gameData.notifications ?? [];
            this.eventHistory = gameData.eventHistory ?? [];
            this.shownNews = gameData.shownNews ?? [];
            
            // Initialize stock prices based on the loaded date
            console.log("Initializing stock prices...");
            this.player.initializeStockPrices();
            
            // Update rent based on the loaded player state
            console.log("Updating rent...");
            this.player.updateRent();
            
            // Adjust expenses for inflation based on the loaded year
            console.log("Adjusting expenses for inflation...");
            this.player.adjustExpensesForInflation();
            
            // Update saved games list
            this.savedGames = this.getSavedGames();
            
            console.log("Game loaded successfully:", {
                day: this.player.currentDay,
                month: this.player.currentMonth,
                year: this.player.currentYear,
                cash: this.player.cash,
                gameState: this.gameState
            });
            return true;
        } catch (error) {
            console.error(`Error loading saved game ${name}:`, error);
            return false;
        }
    }

    // Delete saved game
    deleteSavedGame(name: string): void {
        if (name === 'Autosave') {
            localStorage.removeItem('investmentGameSave');
        } else {
            localStorage.removeItem(`investmentGameSave_${name}`);
        }
        
        // Update saved games list
        this.savedGames = this.getSavedGames();
    }

    // Handle page unload/refresh
    handlePageUnload(): void {
        console.log("Handling page unload, saving game state...");
        
        // Ensure player data is up to date
        this.player.updateRent();
        this.player.adjustExpensesForInflation();
        
        // Save the current game state before unload
        const gameData = {
            player: {
                // Core properties
                age: this.player.age,
                cash: this.player.cash,
                savings: this.player.savings,
                currentDay: this.player.currentDay,
                currentMonth: this.player.currentMonth,
                currentYear: this.player.currentYear,
                monthlyIncome: this.player.monthlyIncome,
                married: this.player.married,
                children: this.player.children,
                jobLossMonths: this.player.jobLossMonths,
                location: this.player.location,
                
                // Complex properties
                stocks: this.player.stocks,
                properties: this.player.properties,
                loans: this.player.loans,
                car: this.player.car,
                insurance: this.player.insurance,
                capitalGains: this.player.capitalGains,
                baseExpenses: this.player.baseExpenses,
                monthlyExpenses: this.player.monthlyExpenses,
                housing: this.player.housing,
                monthlyHousingPayment: this.player.monthlyHousingPayment,
                
                // Price history
                lastMonthPrices: this.player.lastMonthPrices,
                currentMonthPrices: this.player.currentMonthPrices,
                dailyVolatility: this.player.dailyVolatility
            },
            gameState: this.gameState, // Store the actual current state
            previousGameState: this.gameState !== GameState.PAUSED ? this.gameState : this.previousGameState, // Remember if we were running
            notifications: this.notifications,
            eventHistory: this.eventHistory,
            shownNews: this.shownNews,
            saveDate: new Date().toLocaleString(),
            difficulty: this.difficulty
        };
        
        // Save to localStorage
        try {
            localStorage.setItem('investmentGameSave', JSON.stringify(gameData));
            console.log("Game saved successfully on unload:", {
                day: this.player.currentDay,
                month: this.player.currentMonth,
                year: this.player.currentYear,
                cash: this.player.cash
            });
        } catch (error) {
            console.error("Error saving game on unload:", error);
        }
        
        // Clear any running intervals
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }

    private generateInitialHousingMarket(): HousingMarket {
        // Use the same logic as generateNewListings for consistency
        this.generateNewListings();
        return this.housingMarket;
    }

    generateNewListings(): void {
        const currentYear = this.player.currentYear;
        
        // Get available regions from game config
        const availableRegions = GAME_DATA.config.regions;

        // Base property types without fixed multipliers
        const houseTypes = [
            { name: 'Studio Apartment', baseSize: 35, baseCondition: 6 },
            { name: 'One Bedroom Flat', baseSize: 50, baseCondition: 5 },
            { name: 'Two Bedroom Apartment', baseSize: 70, baseCondition: 6 },
            { name: 'Three Bedroom House', baseSize: 100, baseCondition: 7 },
            { name: 'Four Bedroom House', baseSize: 130, baseCondition: 8 },
            { name: 'Fixer-Upper Studio', baseSize: 35, baseCondition: 3 },
            { name: 'Renovation Project Flat', baseSize: 50, baseCondition: 4 },
            { name: 'Distressed Property', baseSize: 70, baseCondition: 2 }
        ];

        // Calculate multiplier based on size and condition
        const calculateMultiplier = (size: number, condition: number): number => {
            // Size multiplier: increases non-linearly with size
            // Reference: 50m² = 1.0
            const sizeMultiplier = Math.pow(size / 50, 0.8); // Use power of 0.8 for diminishing returns
            
            // Condition multiplier: exponential impact
            // Reference: condition 6 = 1.0 (changed from 5)
            const conditionMultiplier = Math.pow(1.15, condition - 6); // 15% change per point difference from 6
            
            return sizeMultiplier * conditionMultiplier;
        };

        const houses: Housing[] = availableRegions.map(region => {
            // Get price per square meter for the region
            const pricePerSqm = GAME_DATA.housePrice[region][currentYear] || 
                               GAME_DATA.housePrice[region][Number(Object.keys(GAME_DATA.housePrice[region]).slice(-1)[0])];
            
            // Pick a random house type
            const houseType = houseTypes[Math.floor(Math.random() * houseTypes.length)];
            
            // Randomize size (±10m²)
            const sizeVariation = Math.floor(Math.random() * 21) - 10; // Random number between -10 and +10
            const finalSize = Math.max(20, houseType.baseSize + sizeVariation); // Minimum 20m²
            
            // Randomize condition (±1 point from base, then -2 to +1 for final variation)
            const baseConditionVariation = Math.floor(Math.random() * 3) - 1; // Random number between -1 and +1
            const baseCondition = Math.max(1, Math.min(10, houseType.baseCondition + baseConditionVariation));
            const finalConditionVariation = Math.floor(Math.random() * 4) - 2; // Random number between -2 and +1
            const finalCondition = Math.max(1, Math.min(10, baseCondition + finalConditionVariation));
            
            // Calculate dynamic multiplier
            const multiplier = calculateMultiplier(finalSize, finalCondition);
            
            // Calculate total price
            const basePrice = pricePerSqm * finalSize;
            
            // Vary the price slightly (±10%)
            const priceVariation = 0.9 + (Math.random() * 0.2);
            const totalPrice = Math.round(basePrice * multiplier * priceVariation);
            
            // Add some variety to names
            const nameVariations = [
                `Charming ${houseType.name}`,
                `Spacious ${houseType.name}`,
                `Beautiful ${houseType.name}`,
                `Modern ${houseType.name}`,
                `Lovely ${houseType.name}`,
                `Cozy ${houseType.name}`,
            ];
            
            // Add condition-specific descriptions
            if (finalCondition <= 3) {
                nameVariations.push(
                    `Handyman's Dream ${houseType.name}`,
                    `Investment Opportunity ${houseType.name}`,
                    `Project ${houseType.name}`,
                    `As-Is ${houseType.name}`
                );
            } else if (finalCondition >= 8) {
                nameVariations.push(
                    `Pristine ${houseType.name}`,
                    `Luxury ${houseType.name}`,
                    `Premium ${houseType.name}`,
                    `Executive ${houseType.name}`
                );
            }
            
            // Add size-specific descriptions
            if (finalSize >= houseType.baseSize + 5) {
                nameVariations.push(
                    `Generous ${houseType.name}`,
                    `Large ${houseType.name}`,
                    `Roomy ${houseType.name}`
                );
            } else if (finalSize <= houseType.baseSize - 5) {
                nameVariations.push(
                    `Compact ${houseType.name}`,
                    `Efficient ${houseType.name}`,
                    `Cozy ${houseType.name}`
                );
            }
            
            const randomName = nameVariations[Math.floor(Math.random() * nameVariations.length)];
            
            return {
                id: `house_${region}_${Date.now()}`,
                type: 'OWNED' as const,
                name: `${randomName} in ${region}`,
                location: region,
                price: totalPrice,
                monthlyPayment: 0,
                size: finalSize,
                condition: finalCondition,
                appreciationRate: 0.03 + ((finalCondition - 5) * 0.002), // Better condition = slightly better appreciation
                propertyTax: Math.round(totalPrice * 0.01), // 1% property tax
                mortgageRate: getInterestRateForYearMonth(currentYear, this.player.currentMonth) / 100 + 0.02, // Base rate + 2% margin
                mortgageTermYears: 30
            };
        });

        // Generate one rental per region
        const rentalTypes = [
            { name: 'Studio Apartment', baseSize: 35, baseCondition: 6 },
            { name: 'One Bedroom Flat', baseSize: 50, baseCondition: 5 },
            { name: 'Two Bedroom Apartment', baseSize: 70, baseCondition: 7 },
            { name: 'Basic Studio', baseSize: 35, baseCondition: 4 },
            { name: 'Budget Flat', baseSize: 50, baseCondition: 3 }
        ];

        const rentals: Housing[] = availableRegions.map(region => {
            // Get monthly rent for the region
            const baseRent = GAME_DATA.rentPrice[region][currentYear] || 
                           GAME_DATA.rentPrice[region][Number(Object.keys(GAME_DATA.rentPrice[region]).slice(-1)[0])];
            
            // Pick a random rental type
            const rentalType = rentalTypes[Math.floor(Math.random() * rentalTypes.length)];
            
            // Randomize size (±10m²)
            const sizeVariation = Math.floor(Math.random() * 21) - 10; // Random number between -10 and +10
            const finalSize = Math.max(20, rentalType.baseSize + sizeVariation); // Minimum 20m²
            
            // Randomize condition (±1 point from base, then -2 to +1 for final variation)
            const baseConditionVariation = Math.floor(Math.random() * 3) - 1; // Random number between -1 and +1
            const baseCondition = Math.max(1, Math.min(10, rentalType.baseCondition + baseConditionVariation));
            const finalConditionVariation = Math.floor(Math.random() * 4) - 2; // Random number between -2 and +1
            const finalCondition = Math.max(1, Math.min(10, baseCondition + finalConditionVariation));
            
            // Calculate dynamic multiplier for rent
            const multiplier = calculateMultiplier(finalSize, finalCondition);
            
            // Vary the rent slightly (±5%)
            const rentVariation = 0.95 + (Math.random() * 0.1);
            const monthlyRent = Math.round(baseRent * multiplier * rentVariation);
            
            // Add some variety to names
            const nameVariations = [
                `Charming ${rentalType.name}`,
                `Spacious ${rentalType.name}`,
                `Beautiful ${rentalType.name}`,
                `Cozy ${rentalType.name}`,
                `Lovely ${rentalType.name}`,
                `Modern ${rentalType.name}`,
            ];

            // Add condition-specific descriptions
            if (finalCondition <= 3) {
                nameVariations.push(
                    `Basic ${rentalType.name}`,
                    `Budget ${rentalType.name}`,
                    `Student ${rentalType.name}`,
                    `No Frills ${rentalType.name}`
                );
            } else if (finalCondition >= 8) {
                nameVariations.push(
                    `Luxury ${rentalType.name}`,
                    `Premium ${rentalType.name}`,
                    `Executive ${rentalType.name}`,
                    `High-End ${rentalType.name}`
                );
            }

            // Add size-specific descriptions
            if (finalSize >= rentalType.baseSize + 5) {
                nameVariations.push(
                    `Generous ${rentalType.name}`,
                    `Large ${rentalType.name}`,
                    `Roomy ${rentalType.name}`
                );
            } else if (finalSize <= rentalType.baseSize - 5) {
                nameVariations.push(
                    `Compact ${rentalType.name}`,
                    `Efficient ${rentalType.name}`,
                    `Cozy ${rentalType.name}`
                );
            }

            const randomName = nameVariations[Math.floor(Math.random() * nameVariations.length)];
            
            return {
                id: `rental_${region}_${Date.now()}`,
                type: 'RENT' as const,
                name: `${randomName} in ${region}`,
                location: region,
                price: 0,
                monthlyPayment: monthlyRent,
                size: finalSize,
                condition: finalCondition,
                appreciationRate: 0
            };
        });

        // Filter out any properties with invalid prices
        this.housingMarket = {
            availableHouses: houses.filter(house => house.price > 0),
            rentals: rentals.filter(rental => rental.monthlyPayment > 0)
        };
    }

    showModal(title: string, content: string): void {
        // Create a modal element
        const modal = document.createElement('div');
        modal.className = 'game-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Add close functionality
        const closeButton = modal.querySelector('.close-button');
        const closeModal = () => {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        };
        
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };

        closeButton?.addEventListener('click', closeModal);
        document.addEventListener('keydown', handleEscape);

        // Add modal to body
        document.body.appendChild(modal);
    }

    processRentTransactions(): void {
        // Only process rent on the first day of the month
        if (this.player.currentDay !== 1) {
            return;
        }

        // Process rent payment if player is renting
        if (this.player.housing?.type === 'RENT') {
            this.player.cash -= this.player.monthlyHousingPayment;
            this.addNotification(`Paid monthly rent of £${this.player.monthlyHousingPayment.toFixed(2)} for ${this.player.housing.name}`);
        }

        // Process rental income from investment properties
        for (const property of this.player.properties) {
            if (property.isRental && property.rentalIncome) {
                this.player.cash += property.rentalIncome;
                this.addNotification(`Received rental income of £${property.rentalIncome.toFixed(2)} from ${property.name}`);
            }
        }
    }

    private checkHappinessEvents(): void {
        const happiness = this.player.happiness;
        
        // Check for severe unhappiness
        if (happiness.total < 30) {
            if (Math.random() < 0.01) { // 1% chance per day when very unhappy
                this.triggerNegativeLifeEvent();
            }
        }
        
        // Check for high happiness benefits
        if (happiness.total > 80) {
            if (Math.random() < 0.01) { // 1% chance per day when very happy
                this.triggerPositiveLifeEvent();
            }
        }
        
        // Notify about significant happiness changes
        if (Math.abs(happiness.total - this._lastHappiness) > 10) {
            this.addNotification(this.getHappinessChangeMessage(happiness.total - this._lastHappiness));
        }
        
        this._lastHappiness = happiness.total;
    }

    private triggerNegativeLifeEvent(): void {
        const events = [
            {
                message: "The stress is affecting your work performance. Your income decreased by 5%.",
                effect: () => {
                    this.player.monthlyIncome *= 0.95;
                    this.player.addShortTermHappinessModifier(-5, 30);
                }
            },
            {
                message: "Your health is suffering from stress. Medical expenses increased.",
                effect: () => {
                    this.player.monthlyExpenses.other += 100;
                    this.player.addShortTermHappinessModifier(-5, 30);
                }
            }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        event.effect();
        this.addNotification(event.message);
    }

    private triggerPositiveLifeEvent(): void {
        const events = [
            {
                message: "Your positive attitude led to a performance bonus!",
                effect: () => {
                    this.player.cash += this.player.monthlyIncome * 0.5;
                    this.player.addShortTermHappinessModifier(5, 30);
                }
            },
            {
                message: "Your work-life balance has improved. You received a small raise!",
                effect: () => {
                    this.player.monthlyIncome *= 1.02;
                    this.player.addShortTermHappinessModifier(5, 30);
                }
            }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        event.effect();
        this.addNotification(event.message);
    }

    private getHappinessChangeMessage(change: number): string {
        if (change > 0) {
            return `Your life satisfaction has improved significantly! (+${change.toFixed(0)} points)`;
        } else {
            return `Your life satisfaction has decreased significantly. (${change.toFixed(0)} points)`;
        }
    }

    private processYearEnd(): void {
        // Implement year-end processing logic
        console.log("Processing year-end...");
    }

    setDifficulty(difficultyOption: { name: GameDifficulty; startingCash: number; baseSalary: number }): void {
        this.difficulty = difficultyOption.name;
        
        // Create a new player with the selected difficulty settings
        this.player = new Player({
            startingCash: difficultyOption.startingCash,
            baseSalary: difficultyOption.baseSalary
        });
        
        // Start the game
        this.setGameState(GameState.PAUSED);
        
        // Add notification about difficulty selection
        this.addNotification(`Game started in ${difficultyOption.name} mode.`);
    }
} 