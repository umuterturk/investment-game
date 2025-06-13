// Game Data - UK Economic Data (2005-2024)
const GAME_DATA = {
    // Game Configuration
    config: {
        startYear: 2005,
        startMonth: 0, // January
        startAge: 25,
        endAge: 45,
        startingCash: 10000,
        timePerMonth: 15000, // 15 seconds per month in normal speed
        fastTimePerMonth: 3000, // 3 seconds per month in fast speed
        monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        regions: ['London', 'South East', 'East of England', 'South West', 'West Midlands', 'East Midlands', 'Yorkshire', 'North West', 'North East', 'Scotland', 'Wales', 'Northern Ireland'],
    },
    
    // Historical Interest Rates (Bank of England base rate)
    interestRates: {
        // Yearly average rates (simplified)
        2005: 4.75, 2006: 5.00, 2007: 5.50, 2008: 2.00, 2009: 0.50,
        2010: 0.50, 2011: 0.50, 2012: 0.50, 2013: 0.50, 2014: 0.50,
        2015: 0.50, 2016: 0.25, 2017: 0.50, 2018: 0.75, 2019: 0.75,
        2020: 0.10, 2021: 0.10, 2022: 3.50, 2023: 5.25, 2024: 5.00
    },
    
    // Capital Gains Tax rates (UK)
    capitalGainsTax: {
        // Simplified CGT rates and allowances by tax year
        2005: { allowance: 8500, basicRate: 0.20, higherRate: 0.40 },
        2010: { allowance: 10100, basicRate: 0.18, higherRate: 0.28 },
        2015: { allowance: 11100, basicRate: 0.18, higherRate: 0.28 },
        2020: { allowance: 12300, basicRate: 0.10, higherRate: 0.20 },
        2024: { allowance: 3000, basicRate: 0.10, higherRate: 0.20 }
    },
    
    // Inflation Data (CPI)
    inflation: {
        // Yearly average inflation rates
        2005: 2.1, 2006: 2.3, 2007: 2.3, 2008: 3.6, 2009: 2.2,
        2010: 3.3, 2011: 4.5, 2012: 2.8, 2013: 2.6, 2014: 1.5,
        2015: 0.0, 2016: 0.7, 2017: 2.7, 2018: 2.5, 2019: 1.8,
        2020: 0.9, 2021: 2.6, 2022: 9.1, 2023: 7.0, 2024: 3.2
    },
    
    // House Price Data (£ per square meter)
    housePrice: {
        // Average price per square meter by region and year
        'London': {
            2005: 3600, 2006: 3800, 2007: 4200, 2008: 4000, 2009: 3900,
            2010: 4100, 2011: 4300, 2012: 4500, 2013: 4800, 2014: 5200,
            2015: 5600, 2016: 5900, 2017: 6000, 2018: 6100, 2019: 6000,
            2020: 6200, 2021: 6500, 2022: 6800, 2023: 6700, 2024: 6600
        },
        'South East': {
            2005: 2400, 2006: 2500, 2007: 2700, 2008: 2600, 2009: 2500,
            2010: 2600, 2011: 2700, 2012: 2800, 2013: 3000, 2014: 3200,
            2015: 3400, 2016: 3600, 2017: 3700, 2018: 3800, 2019: 3800,
            2020: 3900, 2021: 4200, 2022: 4400, 2023: 4300, 2024: 4200
        },
        'East of England': {
            2005: 2200, 2006: 2300, 2007: 2500, 2008: 2400, 2009: 2300,
            2010: 2400, 2011: 2500, 2012: 2600, 2013: 2700, 2014: 2900,
            2015: 3100, 2016: 3300, 2017: 3400, 2018: 3500, 2019: 3500,
            2020: 3600, 2021: 3900, 2022: 4100, 2023: 4000, 2024: 3900
        },
        // Other regions follow similar pattern with appropriate values
        'South West': {
            2005: 2000, 2006: 2100, 2007: 2200, 2008: 2100, 2009: 2000,
            2010: 2100, 2011: 2200, 2012: 2300, 2013: 2400, 2014: 2500,
            2015: 2600, 2016: 2800, 2017: 2900, 2018: 3000, 2019: 3000,
            2020: 3100, 2021: 3400, 2022: 3600, 2023: 3500, 2024: 3400
        },
        'West Midlands': {
            2005: 1800, 2006: 1900, 2007: 2000, 2008: 1900, 2009: 1800,
            2010: 1900, 2011: 1900, 2012: 2000, 2013: 2100, 2014: 2200,
            2015: 2300, 2016: 2400, 2017: 2500, 2018: 2600, 2019: 2600,
            2020: 2700, 2021: 2900, 2022: 3100, 2023: 3000, 2024: 2900
        },
        'North West': {
            2005: 1500, 2006: 1600, 2007: 1700, 2008: 1600, 2009: 1500,
            2010: 1500, 2011: 1600, 2012: 1600, 2013: 1700, 2014: 1800,
            2015: 1900, 2016: 2000, 2017: 2100, 2018: 2200, 2019: 2200,
            2020: 2300, 2021: 2500, 2022: 2700, 2023: 2600, 2024: 2500
        }
    },
    
    // Rent Prices (£ per month for 1-bedroom flat)
    rentPrice: {
        'London': {
            2005: 900, 2006: 950, 2007: 1000, 2008: 1050, 2009: 1000,
            2010: 1100, 2011: 1200, 2012: 1300, 2013: 1400, 2014: 1500,
            2015: 1600, 2016: 1700, 2017: 1750, 2018: 1800, 2019: 1850,
            2020: 1800, 2021: 1750, 2022: 1900, 2023: 2000, 2024: 2100
        },
        'South East': {
            2005: 650, 2006: 680, 2007: 700, 2008: 720, 2009: 700,
            2010: 750, 2011: 800, 2012: 850, 2013: 900, 2014: 950,
            2015: 1000, 2016: 1050, 2017: 1100, 2018: 1150, 2019: 1200,
            2020: 1180, 2021: 1150, 2022: 1250, 2023: 1300, 2024: 1350
        },
        'East of England': {
            2005: 600, 2006: 620, 2007: 650, 2008: 670, 2009: 650,
            2010: 700, 2011: 750, 2012: 800, 2013: 850, 2014: 900,
            2015: 950, 2016: 1000, 2017: 1050, 2018: 1100, 2019: 1150,
            2020: 1130, 2021: 1100, 2022: 1200, 2023: 1250, 2024: 1300
        },
        'South West': {
            2005: 550, 2006: 580, 2007: 600, 2008: 620, 2009: 600,
            2010: 650, 2011: 700, 2012: 750, 2013: 800, 2014: 850,
            2015: 900, 2016: 950, 2017: 1000, 2018: 1050, 2019: 1100,
            2020: 1080, 2021: 1050, 2022: 1150, 2023: 1200, 2024: 1250
        },
        'West Midlands': {
            2005: 500, 2006: 520, 2007: 550, 2008: 570, 2009: 550,
            2010: 600, 2011: 650, 2012: 700, 2013: 750, 2014: 800,
            2015: 850, 2016: 900, 2017: 950, 2018: 1000, 2019: 1050,
            2020: 1030, 2021: 1000, 2022: 1100, 2023: 1150, 2024: 1200
        },
        'North West': {
            2005: 450, 2006: 470, 2007: 500, 2008: 520, 2009: 500,
            2010: 550, 2011: 600, 2012: 650, 2013: 700, 2014: 750,
            2015: 800, 2016: 850, 2017: 900, 2018: 950, 2019: 1000,
            2020: 980, 2021: 950, 2022: 1050, 2023: 1100, 2024: 1150
        }
    },
    
    // Stock Data - 10 UK Stocks (FTSE 100 companies)
    stocks: {
        // Year-end prices (simplified)
        'HSBC': {
            2005: 940, 2006: 930, 2007: 850, 2008: 710, 2009: 720,
            2010: 680, 2011: 520, 2012: 650, 2013: 670, 2014: 620,
            2015: 540, 2016: 650, 2017: 770, 2018: 650, 2019: 600,
            2020: 400, 2021: 450, 2022: 510, 2023: 620, 2024: 650
        },
        'BP': {
            2005: 620, 2006: 570, 2007: 640, 2008: 520, 2009: 600,
            2010: 470, 2011: 460, 2012: 430, 2013: 490, 2014: 420,
            2015: 350, 2016: 500, 2017: 520, 2018: 500, 2019: 480,
            2020: 260, 2021: 340, 2022: 480, 2023: 470, 2024: 460
        },
        'Vodafone': {
            2005: 130, 2006: 150, 2007: 180, 2008: 140, 2009: 140,
            2010: 170, 2011: 180, 2012: 160, 2013: 240, 2014: 230,
            2015: 220, 2016: 200, 2017: 230, 2018: 160, 2019: 150,
            2020: 130, 2021: 120, 2022: 90, 2023: 70, 2024: 75
        },
        'Tesco': {
            2005: 330, 2006: 400, 2007: 470, 2008: 360, 2009: 430,
            2010: 430, 2011: 400, 2012: 340, 2013: 340, 2014: 190,
            2015: 150, 2016: 210, 2017: 210, 2018: 200, 2019: 250,
            2020: 230, 2021: 290, 2022: 250, 2023: 290, 2024: 300
        },
        'Barclays': {
            2005: 590, 2006: 730, 2007: 560, 2008: 150, 2009: 270,
            2010: 260, 2011: 180, 2012: 260, 2013: 270, 2014: 240,
            2015: 220, 2016: 230, 2017: 200, 2018: 160, 2019: 180,
            2020: 150, 2021: 190, 2022: 160, 2023: 150, 2024: 190
        },
        'AstraZeneca': {
            2005: 2800, 2006: 2900, 2007: 2100, 2008: 2700, 2009: 2900,
            2010: 2900, 2011: 2900, 2012: 3000, 2013: 3600, 2014: 4600,
            2015: 4600, 2016: 4400, 2017: 5100, 2018: 5900, 2019: 7600,
            2020: 7400, 2021: 8500, 2022: 11000, 2023: 10500, 2024: 12000
        },
        'Unilever': {
            2005: 1500, 2006: 1400, 2007: 1700, 2008: 1500, 2009: 1900,
            2010: 2000, 2011: 2100, 2012: 2400, 2013: 2500, 2014: 2600,
            2015: 2900, 2016: 3200, 2017: 4100, 2018: 4200, 2019: 4400,
            2020: 4400, 2021: 3900, 2022: 4000, 2023: 3800, 2024: 4200
        },
        'Diageo': {
            2005: 800, 2006: 1000, 2007: 1100, 2008: 900, 2009: 1100,
            2010: 1200, 2011: 1400, 2012: 1800, 2013: 2000, 2014: 1900,
            2015: 1900, 2016: 2200, 2017: 2600, 2018: 2600, 2019: 3200,
            2020: 2900, 2021: 3900, 2022: 3600, 2023: 2800, 2024: 2700
        },
        'GSK': {
            2005: 1400, 2006: 1400, 2007: 1300, 2008: 1300, 2009: 1300,
            2010: 1200, 2011: 1400, 2012: 1300, 2013: 1600, 2014: 1400,
            2015: 1400, 2016: 1500, 2017: 1300, 2018: 1500, 2019: 1800,
            2020: 1400, 2021: 1600, 2022: 1400, 2023: 1500, 2024: 1700
        },
        'Rio Tinto': {
            2005: 2600, 2006: 2700, 2007: 5300, 2008: 1600, 2009: 3400,
            2010: 4500, 2011: 3300, 2012: 3500, 2013: 3500, 2014: 3000,
            2015: 2000, 2016: 3200, 2017: 3900, 2018: 3800, 2019: 4600,
            2020: 5600, 2021: 5000, 2022: 5800, 2023: 5400, 2024: 5100
        }
    },
    
    // Income Tax Brackets (UK)
    incomeTax: {
        // Simplified tax brackets by year
        2005: [
            { threshold: 0, rate: 0 },
            { threshold: 4895, rate: 0.10 },
            { threshold: 7185, rate: 0.22 },
            { threshold: 37295, rate: 0.40 }
        ],
        2010: [
            { threshold: 0, rate: 0 },
            { threshold: 6475, rate: 0.20 },
            { threshold: 37400, rate: 0.40 },
            { threshold: 150000, rate: 0.50 }
        ],
        2015: [
            { threshold: 0, rate: 0 },
            { threshold: 10600, rate: 0.20 },
            { threshold: 42385, rate: 0.40 },
            { threshold: 150000, rate: 0.45 }
        ],
        2020: [
            { threshold: 0, rate: 0 },
            { threshold: 12500, rate: 0.20 },
            { threshold: 50000, rate: 0.40 },
            { threshold: 150000, rate: 0.45 }
        ],
        2024: [
            { threshold: 0, rate: 0 },
            { threshold: 12570, rate: 0.20 },
            { threshold: 50270, rate: 0.40 },
            { threshold: 125140, rate: 0.45 }
        ]
    },
    
    // Average Salaries by Year (UK, annual gross)
    salaries: {
        2005: 24000,
        2006: 25000,
        2007: 26000,
        2008: 26500,
        2009: 26500,
        2010: 27000,
        2011: 27500,
        2012: 28000,
        2013: 28500,
        2014: 29000,
        2015: 30000,
        2016: 31000,
        2017: 32000,
        2018: 33000,
        2019: 34000,
        2020: 35000,
        2021: 36000,
        2022: 38000,
        2023: 40000,
        2024: 42000
    },
    
    // Random Events
    events: [
        {
            id: 'fire',
            name: 'House Fire',
            description: 'A fire has damaged your property!',
            probability: 0.002, // 0.2% chance per month
            effect: (player) => {
                if (player.properties.length > 0) {
                    const property = player.properties[Math.floor(Math.random() * player.properties.length)];
                    const damage = property.value * 0.15;
                    if (player.insurance.home) {
                        return {
                            message: `Your property at ${property.location} had a fire, but insurance covered most of the damage. You paid a £500 excess.`,
                            cashChange: -500
                        };
                    } else {
                        return {
                            message: `Your property at ${property.location} had a fire! Repairs cost £${damage.toFixed(0)}.`,
                            cashChange: -damage
                        };
                    }
                }
                return null;
            }
        },
        {
            id: 'medical',
            name: 'Medical Emergency',
            description: 'You had a medical emergency!',
            probability: 0.003, // 0.3% chance per month
            effect: (player) => {
                const cost = 500 + Math.random() * 2000;
                if (player.insurance.health) {
                    return {
                        message: `You had a medical emergency. Your health insurance covered most costs, but you paid £200 excess.`,
                        cashChange: -200
                    };
                } else {
                    return {
                        message: `You had a medical emergency and had to pay £${cost.toFixed(0)} in medical bills.`,
                        cashChange: -cost
                    };
                }
            }
        },
        {
            id: 'job_loss',
            name: 'Job Loss',
            description: 'You lost your job!',
            probability: 0.001, // 0.1% chance per month
            effect: (player) => {
                const monthsWithoutJob = 1 + Math.floor(Math.random() * 3);
                return {
                    message: `You lost your job and will be without income for ${monthsWithoutJob} months.`,
                    jobLoss: monthsWithoutJob
                };
            }
        },
        {
            id: 'market_crash',
            name: 'Stock Market Crash',
            description: 'The stock market crashed!',
            probability: 0.001, // 0.1% chance per month
            effect: (player) => {
                return {
                    message: `A stock market crash has occurred! Your stock portfolio value has dropped significantly.`,
                    marketCrash: true
                };
            }
        },
        {
            id: 'divorce',
            name: 'Divorce',
            description: 'Your marriage ended in divorce.',
            probability: 0.001, // 0.1% chance per month
            effect: (player) => {
                if (player.married) {
                    return {
                        message: `Your marriage has ended in divorce. Half of your assets will be divided.`,
                        divorce: true
                    };
                }
                return null;
            }
        },
        {
            id: 'car_accident',
            name: 'Traffic Accident',
            description: 'You had a car accident!',
            probability: 0.002, // 0.2% chance per month
            effect: (player) => {
                if (player.car) {
                    const damage = player.car.value * 0.2;
                    if (player.insurance.car) {
                        return {
                            message: `You had a car accident, but insurance covered most of the damage. You paid a £250 excess.`,
                            cashChange: -250
                        };
                    } else {
                        return {
                            message: `You had a car accident! Repairs cost £${damage.toFixed(0)}.`,
                            cashChange: -damage
                        };
                    }
                }
                return null;
            }
        },
        {
            id: 'home_repair',
            name: 'Home Repair',
            description: 'Your home needs urgent repairs!',
            probability: 0.003, // 0.3% chance per month
            effect: (player) => {
                if (player.properties.length > 0) {
                    const property = player.properties[Math.floor(Math.random() * player.properties.length)];
                    const repairCost = property.value * 0.03;
                    return {
                        message: `Your property at ${property.location} needs urgent repairs costing £${repairCost.toFixed(0)}.`,
                        cashChange: -repairCost
                    };
                }
                return null;
            }
        },
        {
            id: 'child',
            name: 'Unexpected Child',
            description: 'You have a child!',
            probability: 0.001, // 0.1% chance per month
            effect: (player) => {
                if (player.age >= 25 && player.age <= 40) {
                    return {
                        message: `Congratulations! You have a child. This will increase your monthly expenses by £500.`,
                        childExpense: 500
                    };
                }
                return null;
            }
        },
        {
            id: 'inheritance',
            name: 'Inheritance',
            description: 'You received an inheritance!',
            probability: 0.0005, // 0.05% chance per month
            effect: (player) => {
                const amount = 5000 + Math.random() * 20000;
                return {
                    message: `You received an inheritance of £${amount.toFixed(0)}.`,
                    cashChange: amount
                };
            }
        },
        {
            id: 'theft',
            name: 'Theft',
            description: 'You were a victim of theft!',
            probability: 0.002, // 0.2% chance per month
            effect: (player) => {
                const amount = 500 + Math.random() * 1500;
                if (player.insurance.contents) {
                    return {
                        message: `You were a victim of theft, but your contents insurance covered most of the loss. You paid a £100 excess.`,
                        cashChange: -100
                    };
                } else {
                    return {
                        message: `You were a victim of theft and lost £${amount.toFixed(0)}.`,
                        cashChange: -amount
                    };
                }
            }
        }
    ]
}; 