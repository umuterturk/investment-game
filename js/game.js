// Investment Life Simulator - Main Game Logic

// Game State
const GameState = {
    PAUSED: 'paused',
    RUNNING: 'running',
    FAST: 'fast',
    ENDED: 'ended'
};

// Make game instance globally available
let game;

// Player State
class Player {
    constructor(game) {
        // Reference to the game instance
        this.game = game;
        
        this.cash = GAME_DATA.config.startingCash;
        this.age = GAME_DATA.config.startAge;
        this.currentYear = GAME_DATA.config.startYear;
        this.currentMonth = GAME_DATA.config.startMonth;
        this.currentDay = 1;
        this.stocks = {}; // Format: { 'HSBC': { shares: 10, avgBuyPrice: 500 } }
        this.properties = []; // Array of property objects
        this.savings = 0;
        this.loans = []; // Array of loan objects
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
        this.monthlyExpenses = { ...this.baseExpenses };
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

    getDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    calculateMonthlyIncome() {
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

    calculateIncomeTax(yearlyIncome) {
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

    getTotalExpenses() {
        let total = 0;
        for (const category in this.monthlyExpenses) {
            total += this.monthlyExpenses[category];
        }
        return total;
    }

    updateRent() {
        // If player owns a property for living, no rent is due
        const hasHome = this.properties.some(p => !p.isRental);
        if (hasHome) {
            this.monthlyExpenses.rent = 0;
            return;
        }

        // Get base rent for current location and year
        const baseRent = GAME_DATA.rentPrice[this.location][this.currentYear] || 
                        GAME_DATA.rentPrice[this.location][Object.keys(GAME_DATA.rentPrice[this.location]).slice(-1)[0]];
        
        // Adjust rent based on family size
        let rentMultiplier = 1;
        if (this.married) rentMultiplier += 0.3; // 30% more for couple
        if (this.children > 0) rentMultiplier += 0.2 * this.children; // 20% more per child

        this.monthlyExpenses.rent = baseRent * rentMultiplier;
    }

    adjustExpensesForInflation() {
        // Calculate cumulative inflation since 2005
        let cumulativeInflation = 1;
        for (let year = GAME_DATA.config.startYear; year <= this.currentYear; year++) {
            if (GAME_DATA.inflation[year]) {
                cumulativeInflation *= (1 + GAME_DATA.inflation[year] / 100);
            }
        }

        // Adjust each expense category for inflation (except rent which is handled separately)
        for (const category in this.baseExpenses) {
            this.monthlyExpenses[category] = this.baseExpenses[category] * cumulativeInflation;
        }

        // Update rent for current year
        this.updateRent();
    }

    getNetWorth() {
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

    getCurrentStockPrice(symbol) {
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

    getCurrentPropertyValue(property) {
        const pricePerSqm = this.getCurrentPropertyPricePerSqm(property.location);
        return property.size * pricePerSqm;
    }

    getCurrentPropertyPricePerSqm(location) {
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
    calculateCapitalGainsTax() {
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

    // Process capital gains tax at the end of the tax year (April)
    processCapitalGainsTax() {
        // Check if it's the end of the tax year (April 5th, but we'll use April 1st for simplicity)
        if (this.currentMonth === 3 && this.currentDay === 1) {
            const taxDue = this.calculateCapitalGainsTax();
            
            if (taxDue > 0) {
                // Deduct tax from cash
                this.cash -= taxDue;
                
                // Record tax paid
                this.capitalGains.taxPaid += taxDue;
                
                // Add notification
                this.game.addNotification(`Paid £${taxDue.toFixed(2)} in capital gains tax for the tax year.`);
                
                // Reset for new tax year
                this.capitalGains.currentTaxYear = 0;
                this.capitalGains.allowanceUsed = 0;
            } else if (this.capitalGains.currentTaxYear > 0) {
                // No tax due but there were gains
                this.game.addNotification(`No capital gains tax due as your gains of £${this.capitalGains.currentTaxYear.toFixed(2)} are within the annual allowance.`);
                
                // Reset for new tax year
                this.capitalGains.currentTaxYear = 0;
                this.capitalGains.allowanceUsed = 0;
            }
        }
    }
}

// Game Controller
class Game {
    constructor() {
        this.player = new Player(this);
        this.gameState = GameState.PAUSED;
        this.previousGameState = null;
        this.timePerDay = GAME_DATA.config.timePerMonth / 30; // Time per day in milliseconds
        this.notifications = [];
        this.eventHistory = [];
        this.newsSystem = new NewsSystem(this);  // Initialize the news system
        
        // Initialize modal
        const modal = document.getElementById('details-modal');
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.onclick = () => this.hideModal();
        window.onclick = (event) => {
            if (event.target === modal) {
                this.hideModal();
            }
        };

        this.initUI();
        this.initMenuSystem();
        this.loadGame();
        this.updateUI();
    }

    initUI() {
        // Time controls
        document.getElementById('pause-btn').addEventListener('click', () => this.setGameState(GameState.PAUSED));
        document.getElementById('play-btn').addEventListener('click', () => this.setGameState(GameState.RUNNING));
        document.getElementById('fast-btn').addEventListener('click', () => this.setGameState(GameState.FAST));
        document.getElementById('menu-btn').addEventListener('click', () => {
            console.log('Menu button clicked');
            this.showMenu();
        });
        
        // Action buttons
        document.getElementById('stocks-btn').addEventListener('click', () => this.showStocksModal());
        document.getElementById('property-btn').addEventListener('click', () => this.showPropertyModal());
        document.getElementById('savings-btn').addEventListener('click', () => this.showSavingsModal());
        document.getElementById('housing-btn').addEventListener('click', () => this.showHousingModal());
        document.getElementById('marriage-btn').addEventListener('click', () => this.showMarriageModal());
        document.getElementById('car-btn').addEventListener('click', () => this.showCarModal());
        document.getElementById('loans-btn').addEventListener('click', () => this.showLoansModal());
        
        // First modal close button
        document.getElementById('modal-close').addEventListener('click', () => this.hideFirstModal());
        
        // First modal background click
        const modalContainer = document.getElementById('modal-container');
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                this.hideFirstModal();
            }
        });
        
        // Menu modal setup
        const menuModal = document.getElementById('menu-modal');
        const menuCloseBtn = menuModal.querySelector('.close-btn');
        menuCloseBtn.addEventListener('click', () => this.hideMenu());
        
        // Menu options
        document.getElementById('restart-game-btn').addEventListener('click', () => this.showRestartConfirmation());
        document.getElementById('save-game-btn').addEventListener('click', () => {
            this.saveGame();
            this.addNotification('Game saved successfully!');
            this.hideMenu();
        });
        document.getElementById('toggle-sound-btn').addEventListener('click', () => this.toggleSound());
        document.getElementById('about-btn').addEventListener('click', () => this.showAboutInfo());
        
        // Close menu when clicking outside
        menuModal.addEventListener('click', (event) => {
            if (event.target === menuModal) {
                this.hideMenu();
            }
        });
    }

    setGameState(newState) {
        // Clear any existing interval
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        this.gameState = newState;
        
        // Update UI to show active state
        document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
        
        switch (newState) {
            case GameState.PAUSED:
                document.getElementById('pause-btn').classList.add('active');
                break;
            case GameState.RUNNING:
                document.getElementById('play-btn').classList.add('active');
                this.gameInterval = setInterval(() => this.update(), this.timePerDay);
                break;
            case GameState.FAST:
                document.getElementById('fast-btn').classList.add('active');
                this.gameInterval = setInterval(() => this.update(), this.timePerDay / 3);
                break;
            case GameState.ENDED:
                this.endGame();
                break;
        }
        
        // Save game state
        this.saveGame();
    }

    update() {
        // Process daily updates
        this.updatePrices();
        this.processDailyExpenses();
        
        // Process monthly updates on the first day of the month
        if (this.player.currentDay === 1) {
            this.processMonthlyIncome();
            this.processSavingsInterest();
            this.processLoans();
            
            // Check for news events
            this.newsSystem.checkForNews();
            
            // Process random events (only personal events, not historical ones)
            this.processRandomEvents();
        }
        
        // Advance time
        this.advanceTime();
        
        // Update UI
        this.updateUI();
        
        // Save game
        this.saveGame();
        
        // Check if game should end
        if (this.player.age >= GAME_DATA.config.endAge) {
            this.setGameState(GameState.ENDED);
        }
    }

    updatePrices() {
        // Update stock prices daily
        for (const symbol in this.player.stocks) {
            const currentPrice = this.player.getCurrentStockPrice(symbol);
            // You might want to trigger events or notifications for significant price changes
            const stock = this.player.stocks[symbol];
            const previousPrice = stock.lastPrice || currentPrice;
            const priceChange = (currentPrice - previousPrice) / previousPrice;
            
            if (Math.abs(priceChange) > 0.05) { // 5% change
                this.addNotification(`${symbol} stock price ${priceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(priceChange * 100).toFixed(1)}%`);
            }
            
            stock.lastPrice = currentPrice;
        }
    }

    advanceTime() {
        // Advance day
        this.player.currentDay++;
        
        // Process daily expenses
        this.processDailyExpenses();
        
        // Check if we need to advance to next month
        const daysInMonth = this.player.getDaysInMonth(this.player.currentMonth, this.player.currentYear);
        if (this.player.currentDay > daysInMonth) {
            this.player.currentDay = 1;
            this.player.currentMonth++;
            
            // Process monthly income
            this.processMonthlyIncome();
            
            // Process savings interest
            this.processSavingsInterest();
            
            // Process loans
            this.processLoans();
            
            // Process random events
            this.processRandomEvents();
            
            // Check if we need to advance to next year
            if (this.player.currentMonth > 11) {
                this.player.currentMonth = 0;
                this.player.currentYear++;
                this.player.age++;
                
                // Update yearly values
                this.player.monthlyIncome = this.player.calculateMonthlyIncome();
                
                // Adjust for inflation at the start of each year
                this.player.adjustExpensesForInflation();
                
                // Add notification about inflation impact
                const inflationRate = GAME_DATA.inflation[this.player.currentYear];
                if (inflationRate) {
                    this.addNotification(`Inflation Update: Cost of living increased by ${inflationRate.toFixed(1)}% this year.`);
                }
                
                // Check if game should end (player reached end age)
                if (this.player.age >= GAME_DATA.config.endAge) {
                    this.endGame();
                    return;
                }
            }
        }
        
        // Process capital gains tax (will only run on April 1st)
        this.player.processCapitalGainsTax();
        
        // Update prices daily
        this.updatePrices();
        
        // Update UI
        this.updateUI();
    }

    processDailyExpenses() {
        // Calculate daily expenses (excluding rent which is processed monthly)
        const monthlyExpenses = { ...this.player.monthlyExpenses };
        delete monthlyExpenses.rent; // Remove rent from daily calculation
        
        const totalMonthlyExpenses = Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0);
        const daysInMonth = this.player.getDaysInMonth(this.player.currentMonth, this.player.currentYear);
        const dailyExpenses = totalMonthlyExpenses / daysInMonth;
        
        // Deduct daily expenses from cash
        this.player.cash -= dailyExpenses;
        
        // Check if player is broke
        if (this.player.cash < 0 && this.player.currentDay % 7 === 0) {
            this.addNotification(`WARNING: You're in overdraft! You need to get more cash quickly.`);
        }
    }

    processMonthlyIncome() {
        // Skip income if player has job loss
        if (this.player.jobLossMonths > 0) {
            this.player.jobLossMonths--;
            this.addNotification(`No income this month. ${this.player.jobLossMonths} months of job loss remaining.`);
            return;
        }
        
        // Add monthly income
        this.player.cash += this.player.monthlyIncome;
        this.addNotification(`Received monthly salary of £${this.player.monthlyIncome.toFixed(2)}.`);
        
        // Add property income
        let propertyIncome = 0;
        for (const property of this.player.properties) {
            if (property.isRental) {
                propertyIncome += property.rentalIncome;
            }
        }
        
        if (propertyIncome > 0) {
            this.player.cash += propertyIncome;
            this.addNotification(`Received £${propertyIncome.toFixed(0)} in rental income.`);
        }
        
        // Process monthly rent
        if (this.player.monthlyExpenses.rent > 0) {
            this.player.cash -= this.player.monthlyExpenses.rent;
            this.addNotification(`Paid monthly rent of £${this.player.monthlyExpenses.rent.toFixed(2)}.`);
        }
    }

    processSavingsInterest() {
        if (this.player.savings > 0) {
            // Get current interest rate
            const interestRate = GAME_DATA.interestRates[this.player.currentYear] / 100;
            
            // Calculate monthly interest
            const monthlyInterest = this.player.savings * (interestRate / 12);
            
            // Add interest to savings
            this.player.savings += monthlyInterest;
            
            // Add notification
            if (monthlyInterest > 1) {
                this.addNotification(`Earned £${monthlyInterest.toFixed(2)} in savings interest.`);
            }
        }
    }

    processLoans() {
        for (let i = this.player.loans.length - 1; i >= 0; i--) {
            const loan = this.player.loans[i];
            
            // Deduct monthly payment
            this.player.cash -= loan.monthlyPayment;
            
            // Reduce remaining amount
            const interestPayment = loan.remainingAmount * (loan.interestRate / 12);
            const principalPayment = loan.monthlyPayment - interestPayment;
            loan.remainingAmount -= principalPayment;
            
            // Check if loan is paid off
            if (loan.remainingAmount <= 0) {
                this.addNotification(`Loan of £${loan.originalAmount.toFixed(0)} fully repaid!`);
                this.player.loans.splice(i, 1);
            }
        }
    }

    processRandomEvents() {
        for (const event of GAME_DATA.events) {
            if (Math.random() < event.probability) {
                const result = event.effect(this.player);
                if (result) {
                    if (result.cashChange) {
                        this.player.cash += result.cashChange;
                    }
                    if (result.childExpense) {
                        this.player.children++;
                        // Update rent as family size changed
                        this.player.updateRent();
                    }
                    this.addNotification(result.message);
                    this.eventHistory.push({
                        date: `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`,
                        event: event.name,
                        result: result.message
                    });
                }
            }
        }
    }

    processMarketCrash() {
        // Reduce all stock prices by 20-40%
        for (const symbol in this.player.stocks) {
            const reduction = 0.2 + Math.random() * 0.2; // 20-40% reduction
            const stock = this.player.stocks[symbol];
            const currentPrice = this.player.getCurrentStockPrice(symbol);
            const newPrice = currentPrice * (1 - reduction);
            
            // We can't actually change the historical data, but we can track the impact
            this.addNotification(`${symbol} stock price dropped by ${(reduction * 100).toFixed(0)}%!`);
        }
    }

    processDivorce() {
        if (this.player.married && Math.random() < 0.0005) { // 0.05% chance per month
            // Lose half of everything
            this.player.cash = Math.floor(this.player.cash / 2);
            this.player.savings = Math.floor(this.player.savings / 2);
            
            // Lose half of stocks
            for (const symbol in this.player.stocks) {
                this.player.stocks[symbol].shares = Math.floor(this.player.stocks[symbol].shares / 2);
            }
            
            // Lose half of properties
            if (this.player.properties.length > 0) {
                const halfProperties = Math.floor(this.player.properties.length / 2);
                this.player.properties.splice(0, halfProperties);
            }
            
            // Reset married status
            this.player.married = false;
            
            // Update rent as family size changed
            this.player.updateRent();
            
            // Add notification
            this.addNotification(`Divorce finalized. You lost half of your assets.`);
        }
    }

    addNotification(message) {
        const date = `${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}`;
        this.notifications.unshift({ date, message });
        
        // Limit to 20 notifications
        if (this.notifications.length > 20) {
            this.notifications.pop();
        }
        
        // Update notifications UI
        this.updateNotificationsUI();
    }

    updateUI() {
        // Update date display with compact format
        document.getElementById('game-date').textContent = 
            `${this.player.currentDay}/${this.player.currentMonth + 1}/${String(this.player.currentYear).slice(-2)}`;
        
        // Format currency values with K/M for larger numbers
        const formatCurrency = (amount) => {
            if (amount >= 1000000) {
                return `£${(amount / 1000000).toFixed(1)}M`;
            } else if (amount >= 1000) {
                return `£${(amount / 1000).toFixed(1)}K`;
            }
            return `£${amount.toFixed(0)}`;
        };

        // Update monetary values with compact format
        document.getElementById('cash').textContent = formatCurrency(this.player.cash);
        document.getElementById('net-worth').textContent = formatCurrency(this.player.getNetWorth());
        
        // Calculate and update net income
        const monthlyIncome = this.player.monthlyIncome;
        const propertyIncome = this.player.properties.reduce((sum, property) => {
            return sum + (property.isRental ? property.rentalIncome : 0);
        }, 0);
        const totalIncome = monthlyIncome + propertyIncome;
        const totalExpenses = this.player.getTotalExpenses();
        const netIncome = totalIncome - totalExpenses;
        
        const netIncomeEl = document.getElementById('net-income');
        netIncomeEl.textContent = (netIncome >= 0 ? '+' : '') + formatCurrency(netIncome);
        netIncomeEl.style.color = netIncome >= 0 ? 'var(--positive)' : 'var(--negative)';
    }

    calculateTotalInvestments() {
        let stocksValue = 0;
        for (const symbol in this.player.stocks) {
            const stock = this.player.stocks[symbol];
            const currentPrice = this.player.getCurrentStockPrice(symbol);
            stocksValue += stock.shares * currentPrice;
        }

        let propertiesValue = 0;
        for (const property of this.player.properties) {
            propertiesValue += this.player.getCurrentPropertyValue(property);
        }

        return stocksValue + propertiesValue + this.player.savings;
    }

    updateNotificationsUI() {
        const notificationsContainer = document.getElementById('notifications');
        notificationsContainer.innerHTML = '';
        
        for (const notification of this.notifications) {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification';
            notificationElement.innerHTML = `<strong>${notification.date}:</strong> ${notification.message}`;
            notificationsContainer.appendChild(notificationElement);
        }
    }

    updateCharts() {
        // Update stock chart data
        const stockSymbols = Object.keys(GAME_DATA.stocks);
        
        if (!this.stockChart) {
            // Initialize chart data
            const labels = [];
            const datasets = [];
            
            // Create datasets for each stock
            for (const symbol of stockSymbols) {
                datasets.push({
                    label: symbol,
                    data: [],
                    borderColor: this.getRandomColor(),
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Create chart with proper sizing
            const ctx = document.getElementById('stock-chart').getContext('2d');
            this.stockChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2.5,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 10,
                                font: {
                                    size: 10
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                font: {
                                    size: 10
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Update chart data
        const currentDate = `${this.player.currentDay}/${this.player.currentMonth + 1}/${this.player.currentYear}`;
        
        // Update chart every 3 days to avoid cluttering
        if (this.player.currentDay % 3 === 0) {
            this.stockChart.data.labels.push(currentDate);
            
            // Limit to last 30 data points to prevent canvas size issues
            if (this.stockChart.data.labels.length > 30) {
                this.stockChart.data.labels.shift();
            }
            
            // Update each dataset
            for (let i = 0; i < stockSymbols.length; i++) {
                const symbol = stockSymbols[i];
                const price = this.player.getCurrentStockPrice(symbol);
                
                this.stockChart.data.datasets[i].data.push(price);
                
                // Limit to last 30 data points
                if (this.stockChart.data.datasets[i].data.length > 30) {
                    this.stockChart.data.datasets[i].data.shift();
                }
            }
            
            this.stockChart.update();
        }
        
        // Similar logic for property chart
        if (!this.propertyChart) {
            // Initialize property chart
            const labels = [];
            const datasets = [];
            
            // Create datasets for key regions
            const regions = ['London', 'South East', 'North West'];
            for (const region of regions) {
                datasets.push({
                    label: region,
                    data: [],
                    borderColor: this.getRandomColor(),
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Create chart with proper sizing
            const ctx = document.getElementById('property-chart').getContext('2d');
            this.propertyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2.5,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 10,
                                font: {
                                    size: 10
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                font: {
                                    size: 10
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Update property chart every 5 days (properties are less volatile)
        if (this.player.currentDay % 5 === 0) {
            this.propertyChart.data.labels.push(currentDate);
            
            // Limit to last 30 data points to prevent canvas size issues
            if (this.propertyChart.data.labels.length > 30) {
                this.propertyChart.data.labels.shift();
            }
            
            // Update each dataset
            const regions = ['London', 'South East', 'North West'];
            for (let i = 0; i < regions.length; i++) {
                const region = regions[i];
                const price = this.player.getCurrentPropertyPricePerSqm(region);
                
                this.propertyChart.data.datasets[i].data.push(price);
                
                // Limit to last 30 data points
                if (this.propertyChart.data.datasets[i].data.length > 30) {
                    this.propertyChart.data.datasets[i].data.shift();
                }
            }
            
            this.propertyChart.update();
        }
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    showModal(title, content) {
        const modal = document.getElementById('details-modal');
        document.querySelector('#details-modal-title .title-text').textContent = title;
        document.getElementById('details-modal-content').innerHTML = content;
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    hideModal() {
        document.getElementById('details-modal').style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // First modal handling
    showFirstModal(title, content) {
        const modalContainer = document.getElementById('modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        
        modalContainer.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }
    
    hideFirstModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }
    
    // Modal content generators will be implemented in the next phase
    showStocksModal() {
        // Create content for the stocks modal
        let content = `
            <div class="stocks-modal">
                <div class="cash-display">Available Cash: <span class="highlight">£${this.player.cash.toFixed(2)}</span></div>
                <div class="stocks-container">`;
        
        // Add each stock as a card
        for (const symbol in GAME_DATA.stocks) {
            const currentPrice = this.player.getCurrentStockPrice(symbol);
            // Skip if price is NaN or undefined
            if (isNaN(currentPrice) || currentPrice === undefined) {
                console.error(`Invalid price for ${symbol}: ${currentPrice}`);
                continue;
            }
            
            const owned = this.player.stocks[symbol] ? this.player.stocks[symbol].shares : 0;
            const value = owned * currentPrice;
            const avgBuyPrice = this.player.stocks[symbol] ? this.player.stocks[symbol].avgBuyPrice : 0;
            
            // Calculate profit/loss only if we own shares and have a valid average buy price
            let profitLoss = 0;
            let profitLossClass = '';
            
            if (owned > 0 && avgBuyPrice > 0) {
                profitLoss = ((currentPrice - avgBuyPrice) / avgBuyPrice * 100).toFixed(1);
                profitLossClass = profitLoss > 0 ? 'profit' : profitLoss < 0 ? 'loss' : '';
            }
            
            // Check if player has enough cash to buy at least one share
            const canBuyAtLeastOne = this.player.cash >= currentPrice;
            
            content += `
                <div class="stock-card">
                    <div class="stock-header">
                        <div class="stock-symbol">${symbol}</div>
                        <div class="stock-price">£${currentPrice.toFixed(2)}</div>
                    </div>
                    
                    <div class="stock-info">
                        <div class="stock-detail">
                            <span class="detail-label">Owned:</span>
                            <span class="detail-value">${owned}</span>
                        </div>
                        <div class="stock-detail">
                            <span class="detail-label">Value:</span>
                            <span class="detail-value">£${value.toFixed(2)} ${owned > 0 ? `<span class="${profitLossClass}">(${profitLoss > 0 ? '+' : ''}${profitLoss}%)</span>` : ''}</span>
                        </div>
                    </div>
                    
                    <div class="stock-actions">
                        <div class="stock-action-container">
                            <input type="number" id="buy-${symbol}" class="stock-quantity" min="1" value="1" ${!canBuyAtLeastOne ? 'disabled' : ''}>
                            <button class="buy-btn ${!canBuyAtLeastOne ? 'disabled' : ''}" data-symbol="${symbol}" ${!canBuyAtLeastOne ? 'disabled' : ''}>Buy</button>
                        </div>
                        ${owned > 0 ? `
                        <div class="stock-action-container">
                            <input type="number" id="sell-${symbol}" class="stock-quantity" min="1" max="${owned}" value="${owned}">
                            <button class="sell-btn" data-symbol="${symbol}">Sell</button>
                        </div>` : ''}
                    </div>
                </div>`;
        }
        
        content += `
                </div>
            </div>
        `;
        
        this.showFirstModal('Stock Market', content);
        
        // Add event listeners for buy buttons
        document.querySelectorAll('.buy-btn').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', () => {
                    const symbol = button.getAttribute('data-symbol');
                    const quantity = parseInt(document.getElementById(`buy-${symbol}`).value);
                    this.buyStock(symbol, quantity);
                });
            }
        });
        
        // Add event listeners for sell buttons
        document.querySelectorAll('.sell-btn').forEach(button => {
            button.addEventListener('click', () => {
                const symbol = button.getAttribute('data-symbol');
                const quantity = parseInt(document.getElementById(`sell-${symbol}`).value);
                this.sellStock(symbol, quantity);
            });
        });
        
        // Add event listeners to update button state when quantity changes
        document.querySelectorAll('.stock-quantity').forEach(input => {
            if (input.id.startsWith('buy-')) {
                input.addEventListener('input', () => {
                    const symbol = input.id.replace('buy-', '');
                    const quantity = parseInt(input.value) || 0;
                    const currentPrice = this.player.getCurrentStockPrice(symbol);
                    const totalCost = currentPrice * quantity;
                    const buyButton = input.nextElementSibling;
                    
                    if (totalCost > this.player.cash) {
                        buyButton.disabled = true;
                        buyButton.classList.add('disabled');
                    } else {
                        buyButton.disabled = false;
                        buyButton.classList.remove('disabled');
                    }
                });
            }
        });
    }

    buyStock(symbol, quantity) {
        const currentPrice = this.player.getCurrentStockPrice(symbol);
        const totalCost = currentPrice * quantity;
        
        if (totalCost > this.player.cash) {
            this.addNotification(`Not enough cash to buy ${quantity} shares of ${symbol}.`);
            this.showStocksModal(); // Refresh the modal to update disabled states
            return;
        }
        
        // Update player's cash
        this.player.cash -= totalCost;
        
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
            const totalShares = currentShares + quantity;
            const newAvgPrice = ((currentShares * currentAvgPrice) + (quantity * currentPrice)) / totalShares;
            
            this.player.stocks[symbol].shares = totalShares;
            this.player.stocks[symbol].avgBuyPrice = newAvgPrice;
        }
        
        this.addNotification(`Bought ${quantity} shares of ${symbol} for £${totalCost.toFixed(2)}.`);
        
        // Update UI to reflect changes
        this.updateUI();
        
        // Refresh the stocks modal to show updated values
        this.showStocksModal();
    }

    sellStock(symbol, quantity) {
        if (!this.player.stocks[symbol] || this.player.stocks[symbol].shares < quantity) {
            this.addNotification(`You don't own enough shares of ${symbol} to sell.`);
            return;
        }
        
        const currentPrice = this.player.getCurrentStockPrice(symbol);
        const totalValue = currentPrice * quantity;
        const avgBuyPrice = this.player.stocks[symbol].avgBuyPrice;
        const costBasis = avgBuyPrice * quantity;
        
        // Calculate capital gain or loss
        const capitalGain = totalValue - costBasis;
        
        // Track capital gains for tax purposes
        if (capitalGain > 0) {
            this.player.capitalGains.currentTaxYear += capitalGain;
        }
        
        // Update player's cash
        this.player.cash += totalValue;
        
        // Update player's stocks
        this.player.stocks[symbol].shares -= quantity;
        
        // Remove the stock entry if no shares left
        if (this.player.stocks[symbol].shares === 0) {
            delete this.player.stocks[symbol];
        }
        
        const gainOrLoss = capitalGain >= 0 ? 'gain' : 'loss';
        this.addNotification(`Sold ${quantity} shares of ${symbol} for £${totalValue.toFixed(2)}. Capital ${gainOrLoss}: £${Math.abs(capitalGain).toFixed(2)}.`);
        
        // Update UI to reflect changes
        this.updateUI();
        
        // Refresh the stocks modal to show updated values
        this.showStocksModal();
    }

    showPropertyModal() {
        // Placeholder - will implement in next phase
        this.showFirstModal('Property Market', 'Property market functionality coming soon...');
    }

    showSavingsModal() {
        // Placeholder - will implement in next phase
        this.showFirstModal('Savings Account', 'Savings account functionality coming soon...');
    }

    showHousingModal() {
        // Placeholder - will implement in next phase
        this.showFirstModal('Housing Options', 'Housing options functionality coming soon...');
    }

    showMarriageModal() {
        // Placeholder - will implement in next phase
        this.showFirstModal('Marriage', 'Marriage functionality coming soon...');
    }

    showCarModal() {
        // Placeholder - will implement in next phase
        this.showFirstModal('Car Purchase', 'Car purchase functionality coming soon...');
    }

    showLoansModal() {
        // Placeholder - will implement in next phase
        this.showFirstModal('Loans', 'Loans functionality coming soon...');
    }

    saveGame() {
        console.log('Save game');
        // Add save functionality here
        this.hideMenu();
    }

    loadGame() {
        try {
            const savedData = localStorage.getItem('investmentGameSave');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                
                // Create a new Player instance and copy saved data
                const loadedPlayer = new Player(this);
                Object.assign(loadedPlayer, gameData.player);
                this.player = loadedPlayer;
                
                this.notifications = gameData.notifications;
                this.eventHistory = gameData.eventHistory;
                
                // Add notification about loaded game
                this.addNotification('Game loaded from previous save.');
            } else {
                // Add welcome notification for new game
                this.addNotification('Welcome to Investment Life Simulator! Make wise financial decisions to grow your wealth.');
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
    }

    endGame() {
        // Calculate final net worth
        const finalNetWorth = this.player.getNetWorth();
        
        // Generate end game summary
        let summary = `
            <h2>Game Over!</h2>
            <p>You've reached age ${this.player.age}.</p>
            <h3>Final Net Worth: £${finalNetWorth.toFixed(0)}</h3>
            
            <h3>Assets Breakdown:</h3>
            <ul>
                <li>Cash: £${this.player.cash.toFixed(0)}</li>
                <li>Savings: £${this.player.savings.toFixed(0)}</li>
        `;
        
        // Add stocks
        let totalStocksValue = 0;
        for (const symbol in this.player.stocks) {
            const stock = this.player.stocks[symbol];
            const currentPrice = this.player.getCurrentStockPrice(symbol);
            const value = stock.shares * currentPrice;
            totalStocksValue += value;
        }
        summary += `<li>Stocks: £${totalStocksValue.toFixed(0)}</li>`;
        
        // Add properties
        let totalPropertiesValue = 0;
        for (const property of this.player.properties) {
            totalPropertiesValue += this.player.getCurrentPropertyValue(property);
        }
        summary += `<li>Properties: £${totalPropertiesValue.toFixed(0)}</li>`;
        
        // Add car
        if (this.player.car) {
            summary += `<li>Car: £${this.player.car.value.toFixed(0)}</li>`;
        }
        
        // Add liabilities
        let totalLoansValue = 0;
        for (const loan of this.player.loans) {
            totalLoansValue += loan.remainingAmount;
        }
        
        if (totalLoansValue > 0) {
            summary += `<li>Outstanding Loans: -£${totalLoansValue.toFixed(0)}</li>`;
        }
        
        summary += `</ul>`;
        
        // Add life events summary
        summary += `
            <h3>Life Events:</h3>
            <ul>
        `;
        
        for (const event of this.eventHistory) {
            summary += `<li><strong>${event.date}:</strong> ${event.event}</li>`;
        }
        
        summary += `</ul>`;
        
        // Add restart button
        summary += `
            <button id="restart-btn" class="pixel-btn">Start New Game</button>
        `;
        
        // Show end game modal
        this.showModal('Game Over', summary);
        
        // Add event listener to restart button
        setTimeout(() => {
            document.getElementById('restart-btn').addEventListener('click', () => {
                localStorage.removeItem('investmentGameSave');
                location.reload();
            });
        }, 100);
    }

    buyProperty(property) {
        if (this.player.cash >= property.price) {
            this.player.cash -= property.price;
            this.player.properties.push(property);
            this.addNotification(`Purchased property in ${property.location} for £${property.price.toFixed(0)}`);
            
            // Update rent expense as player might have bought a home
            this.player.updateRent();
        }
    }

    sellProperty(propertyIndex) {
        const property = this.player.properties[propertyIndex];
        const currentValue = this.player.getCurrentPropertyValue(property);
        this.player.cash += currentValue;
        this.player.properties.splice(propertyIndex, 1);
        this.addNotification(`Sold property in ${property.location} for £${currentValue.toFixed(0)}`);
        
        // Update rent expense as player might have sold their home
        this.player.updateRent();
    }

    processMarriage() {
        if (!this.player.married && Math.random() < 0.001) { // 0.1% chance per month
            this.player.married = true;
            // Marriage bonus: spouse brings some assets
            const bonus = this.player.monthlyIncome * 6; // 6 months of income as bonus
            this.player.cash += bonus;
            this.addNotification(`Congratulations on your marriage! Your spouse brought £${bonus.toFixed(0)} in assets.`);
            
            // Update rent as family size changed
            this.player.updateRent();
        }
    }

    showDateDetails() {
        const age = this.player.age;
        const yearsLeft = GAME_DATA.config.endAge - age;
        
        // Get day name
        const date = new Date(this.player.currentYear, this.player.currentMonth, this.player.currentDay);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];
        
        // Format marital status with more detail
        let maritalStatus = this.player.married ? 'Married' : 'Single';
        if (this.player.married && this.player.children > 0) {
            maritalStatus += ` with ${this.player.children} ${this.player.children === 1 ? 'child' : 'children'}`;
        }
        
        const content = `
            <div class="detail-section">
                <div class="detail-section-title">Personal Information</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">cake</span>Age</span>
                    <span class="detail-value">${age} years old</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">favorite</span>Status</span>
                    <span class="detail-value">${maritalStatus}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">location_on</span>Location</span>
                    <span class="detail-value">${this.player.location}</span>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Current Date</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">event</span>Day</span>
                    <span class="detail-value">${dayName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">calendar_today</span>Date</span>
                    <span class="detail-value">${this.player.currentDay} ${GAME_DATA.config.monthNames[this.player.currentMonth]} ${this.player.currentYear}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">timer</span>Until Retirement</span>
                    <span class="detail-value">${yearsLeft} years</span>
                </div>
            </div>
        `;
        this.showModal('Personal Details', content);
    }

    showCashDetails() {
        const formatCurrency = (amount) => {
            if (isNaN(amount) || amount === undefined) {
                return '£0';
            }
            if (amount >= 1000000) {
                return `£${(amount / 1000000).toFixed(1)}M`;
            } else if (amount >= 1000) {
                return `£${(amount / 1000).toFixed(1)}K`;
            }
            return `£${amount.toFixed(0)}`;
        };

        // Calculate daily expenses
        const monthlyExpenses = { ...this.player.monthlyExpenses };
        const rentAmount = monthlyExpenses.rent || 0;
        delete monthlyExpenses.rent; // Remove rent from daily calculation
        
        const totalDailyExpenses = Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0) / 
                                  this.player.getDaysInMonth(this.player.currentMonth, this.player.currentYear);

        const content = `
            <div class="detail-section">
                <div class="detail-section-title">Available Funds</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">account_balance_wallet</span>Cash</span>
                    <span class="detail-value">${formatCurrency(this.player.cash)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">savings</span>Savings</span>
                    <span class="detail-value">${formatCurrency(this.player.savings)}</span>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Daily Cash Flow</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">trending_down</span>Daily Expenses</span>
                    <span class="detail-value negative">-${formatCurrency(totalDailyExpenses)}</span>
                </div>
                <div class="detail-row detail-subitem">
                    <span class="detail-label">Food</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.monthlyExpenses.food / 30)}</span>
                </div>
                <div class="detail-row detail-subitem">
                    <span class="detail-label">Utilities</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.monthlyExpenses.utilities / 30)}</span>
                </div>
                <div class="detail-row detail-subitem">
                    <span class="detail-label">Transport</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.monthlyExpenses.transport / 30)}</span>
                </div>
                <div class="detail-row detail-subitem">
                    <span class="detail-label">Entertainment</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.monthlyExpenses.entertainment / 30)}</span>
                </div>
                <div class="detail-row detail-subitem">
                    <span class="detail-label"><span class="material-icons">more_horiz</span>Other</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.monthlyExpenses.other / 30)}</span>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Monthly Cash Flow</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">trending_up</span>Monthly Income</span>
                    <span class="detail-value positive">+${formatCurrency(this.player.monthlyIncome)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">home</span>Monthly Rent</span>
                    <span class="detail-value negative">-${formatCurrency(rentAmount)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">account_balance</span>Monthly Loan Payments</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0))}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">calculate</span>Net Monthly</span>
                    <span class="detail-value ${(this.player.monthlyIncome - rentAmount - this.player.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0) - totalDailyExpenses * 30) >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(this.player.monthlyIncome - rentAmount - this.player.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0) - totalDailyExpenses * 30)}
                    </span>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Liabilities</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">credit_card</span>Outstanding Loans</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.loans.reduce((sum, loan) => sum + loan.remainingAmount, 0))}</span>
                </div>
            </div>
        `;
        this.showModal('Cash Overview', content);
    }

    showNetWorthDetails() {
        const formatCurrency = (amount) => {
            if (isNaN(amount) || amount === undefined) {
                return '£0';
            }
            if (amount >= 1000000) {
                return `£${(amount / 1000000).toFixed(1)}M`;
            } else if (amount >= 1000) {
                return `£${(amount / 1000).toFixed(1)}K`;
            }
            return `£${amount.toFixed(0)}`;
        };

        const stocksValue = Object.entries(this.player.stocks).reduce((sum, [symbol, stock]) => {
            const price = this.player.getCurrentStockPrice(symbol);
            if (isNaN(price) || price === undefined) {
                return sum;
            }
            return sum + (stock.shares * price);
        }, 0);
        
        const propertiesValue = this.player.properties.reduce((sum, property) => {
            return sum + this.player.getCurrentPropertyValue(property);
        }, 0);
        const loansValue = this.player.loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
        const carValue = this.player.car ? this.player.car.value : 0;
        const totalAssets = this.player.cash + this.player.savings + stocksValue + propertiesValue + carValue;

        // Create stock breakdown HTML if player owns stocks
        let stockBreakdown = '';
        if (Object.keys(this.player.stocks).length > 0) {
            stockBreakdown = `
                <div class="detail-section">
                    <div class="detail-section-title">Stock Portfolio Details</div>
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>Stock</th>
                                <th>Shares</th>
                                <th>Avg. Buy</th>
                                <th>Current</th>
                                <th>Value</th>
                                <th>P/L</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const [symbol, stock] of Object.entries(this.player.stocks)) {
                const currentPrice = this.player.getCurrentStockPrice(symbol);
                
                // Skip if price is invalid
                if (isNaN(currentPrice) || currentPrice === undefined) {
                    continue;
                }
                
                const value = stock.shares * currentPrice;
                
                // Calculate profit/loss only if we have a valid average buy price
                let profitLoss = 0;
                let profitLossClass = '';
                
                if (stock.avgBuyPrice > 0) {
                    profitLoss = ((currentPrice - stock.avgBuyPrice) / stock.avgBuyPrice * 100).toFixed(1);
                    profitLossClass = profitLoss > 0 ? 'positive' : profitLoss < 0 ? 'negative' : '';
                }
                
                stockBreakdown += `
                    <tr>
                        <td>${symbol}</td>
                        <td>${stock.shares}</td>
                        <td>£${stock.avgBuyPrice.toFixed(2)}</td>
                        <td>£${currentPrice.toFixed(2)}</td>
                        <td>${formatCurrency(value)}</td>
                        <td class="${profitLossClass}">${profitLoss > 0 ? '+' : ''}${profitLoss}%</td>
                    </tr>
                `;
            }
            
            stockBreakdown += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        const content = `
            <div class="detail-section">
                <div class="detail-section-title">Liquid Assets</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">account_balance_wallet</span>Cash</span>
                    <span class="detail-value">${formatCurrency(this.player.cash)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">savings</span>Savings</span>
                    <span class="detail-value">${formatCurrency(this.player.savings)}</span>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Investments</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">show_chart</span>Stocks Portfolio</span>
                    <span class="detail-value">${formatCurrency(stocksValue)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">apartment</span>Properties</span>
                    <span class="detail-value">${formatCurrency(propertiesValue)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">directions_car</span>Vehicle</span>
                    <span class="detail-value">${formatCurrency(carValue)}</span>
                </div>
            </div>
            ${stockBreakdown}
            <div class="detail-section">
                <div class="detail-section-title">Summary</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">account_balance</span>Total Assets</span>
                    <span class="detail-value positive">${formatCurrency(totalAssets)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">credit_card</span>Total Liabilities</span>
                    <span class="detail-value negative">-${formatCurrency(loansValue)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">calculate</span>Net Worth</span>
                    <span class="detail-value ${this.player.getNetWorth() >= 0 ? 'positive' : 'negative'}">${formatCurrency(this.player.getNetWorth())}</span>
                </div>
            </div>
        `;
        this.showModal('Net Worth Breakdown', content);
    }

    showIncomeDetails() {
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        };
        
        // Calculate income values
        const salary = this.player.monthlyIncome * 12;
        const savingsInterest = this.player.savings * (GAME_DATA.interestRates[this.player.currentYear] / 100);
        
        // Calculate rental income
        let rentalIncome = 0;
        for (const property of this.player.properties) {
            if (property.isRental) {
                rentalIncome += property.rentalIncome * 12;
            }
        }
        
        const totalIncome = salary + savingsInterest + rentalIncome;
        const expenses = this.player.monthlyExpenses;
        const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
        const netIncome = totalIncome - totalExpenses;
        
        // Get capital gains tax information
        const taxYears = Object.keys(GAME_DATA.capitalGainsTax).map(Number);
        let closestYear = taxYears[0];
        for (const year of taxYears) {
            if (year <= this.player.currentYear && year > closestYear) {
                closestYear = year;
            }
        }
        const taxRates = GAME_DATA.capitalGainsTax[closestYear];
        
        const content = `
            <div class="detail-section">
                <div class="detail-section-title">Annual Income</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">work</span>Salary (after tax)</span>
                    <span class="detail-value positive">+${formatCurrency(salary)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">savings</span>Savings Interest</span>
                    <span class="detail-value positive">+${formatCurrency(savingsInterest)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">home</span>Rental Income</span>
                    <span class="detail-value positive">+${formatCurrency(rentalIncome)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">add_circle</span>Total Income</span>
                    <span class="detail-value positive">+${formatCurrency(totalIncome)}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-title">Monthly Expenses</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">home</span>Rent</span>
                    <span class="detail-value negative">-${formatCurrency(expenses.rent)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">lightbulb</span>Utilities</span>
                    <span class="detail-value negative">-${formatCurrency(expenses.utilities)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">restaurant</span>Food</span>
                    <span class="detail-value negative">-${formatCurrency(expenses.food)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">directions_bus</span>Transport</span>
                    <span class="detail-value negative">-${formatCurrency(expenses.transport)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">sports_esports</span>Entertainment</span>
                    <span class="detail-value negative">-${formatCurrency(expenses.entertainment)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">more_horiz</span>Other</span>
                    <span class="detail-value negative">-${formatCurrency(expenses.other)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">money_off</span>Total Expenses</span>
                    <span class="detail-value negative">-${formatCurrency(totalExpenses)}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-title">Net Income</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">account_balance</span>Monthly Net Income</span>
                    <span class="detail-value ${netIncome >= 0 ? 'positive' : 'negative'}">${netIncome >= 0 ? '+' : ''}${formatCurrency(netIncome / 12)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">account_balance</span>Annual Net Income</span>
                    <span class="detail-value ${netIncome >= 0 ? 'positive' : 'negative'}">${netIncome >= 0 ? '+' : ''}${formatCurrency(netIncome)}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-title">Capital Gains Tax Information</div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">trending_up</span>Current Tax Year Gains</span>
                    <span class="detail-value">${formatCurrency(this.player.capitalGains.currentTaxYear)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">account_balance</span>Annual Tax-Free Allowance</span>
                    <span class="detail-value positive">+${formatCurrency(taxRates.allowance)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">percent</span>Capital Gains Tax Rate</span>
                    <span class="detail-value">${(taxRates.higherRate * 100).toFixed(0)}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">payments</span>Tax Paid This Year</span>
                    <span class="detail-value negative">-${formatCurrency(this.player.capitalGains.taxPaid)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label"><span class="material-icons">info</span>Tax Year End</span>
                    <span class="detail-value">April 5th</span>
                </div>
            </div>
        `;
        
        this.showModal('Income & Expenses', content);
    }

    // Menu related methods
    showMenu() {
        // Pause the game when menu is opened
        if (this.gameState !== GameState.PAUSED) {
            this.previousGameState = this.gameState;
            this.setGameState(GameState.PAUSED);
        }
        
        const menuModal = document.getElementById('menu-modal');
        menuModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        
        console.log('Menu opened'); // Debug log
    }
    
    hideMenu() {
        const menuModal = document.getElementById('menu-modal');
        menuModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        
        console.log('Menu closed'); // Debug log
        
        // Resume game if it was running before
        if (this.previousGameState && this.previousGameState !== GameState.PAUSED) {
            this.setGameState(this.previousGameState);
            this.previousGameState = null;
        }
    }
    
    showRestartConfirmation() {
        // Create confirmation dialog
        const content = `
            <div class="confirm-dialog">
                <p>Are you sure you want to restart the game? All progress will be lost.</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn confirm-no">No</button>
                    <button class="confirm-btn confirm-yes">Yes, Restart</button>
                </div>
            </div>
        `;
        
        this.showFirstModal('Restart Game', content);
        this.hideMenu();
        
        // Add event listeners
        document.querySelector('.confirm-yes').addEventListener('click', () => {
            this.restartGame();
            this.hideFirstModal();
        });
        
        document.querySelector('.confirm-no').addEventListener('click', () => {
            this.hideFirstModal();
            this.showMenu();
        });
    }
    
    restartGame() {
        // Clear saved game data
        localStorage.removeItem('investmentGameSave');
        
        // Reset game state
        this.player = new Player(this);
        this.notifications = [];
        this.eventHistory = [];
        this.gameState = GameState.PAUSED;
        
        // Reset UI
        this.updateUI();
        
        // Add notification
        this.addNotification('Welcome to Investment Life Simulator! Make wise financial decisions to grow your wealth.');
    }
    
    toggleSound() {
        console.log('Toggle sound');
        // Add sound toggle functionality here
        const soundButton = document.getElementById('toggle-sound-btn');
        const soundIcon = soundButton.querySelector('.material-icons');
        
        if (soundIcon.textContent === 'volume_up') {
            soundIcon.textContent = 'volume_off';
            soundButton.innerHTML = soundButton.innerHTML.replace('Sound: On', 'Sound: Off');
        } else {
            soundIcon.textContent = 'volume_up';
            soundButton.innerHTML = soundButton.innerHTML.replace('Sound: Off', 'Sound: On');
        }
    }
    
    showAboutInfo() {
        console.log('Show about');
        // Add about dialog here
        this.hideMenu();
    }

    initMenuSystem() {
        // Menu button listeners
        document.querySelector('#menu-modal .close-btn').addEventListener('click', () => this.hideMenu());
        document.getElementById('restart-game-btn').addEventListener('click', () => this.confirmRestart());
        document.getElementById('save-game-btn').addEventListener('click', () => this.saveGame());
        document.getElementById('toggle-sound-btn').addEventListener('click', () => this.toggleSound());
        document.getElementById('about-btn').addEventListener('click', () => this.showAboutInfo());
    }

    confirmRestart() {
        console.log('Restart game confirmation');
        // Add confirmation dialog here
        this.hideMenu();
    }

    // For testing menu functionality
    testMenu() {
        console.log('Test menu function called');
        const menuModal = document.getElementById('menu-modal');
        if (menuModal.classList.contains('hidden')) {
            menuModal.classList.remove('hidden');
            console.log('Menu opened via test function');
        } else {
            menuModal.classList.add('hidden');
            console.log('Menu closed via test function');
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
}); 