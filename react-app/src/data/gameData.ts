// Game Data - UK Economic Data (2005-2024)


interface DetailedInterestRate {
    date: string;  // Format: 'YYYY-MM-DD'
    rate: number;
}

interface DetailedInterestRates {
    rates: DetailedInterestRate[];
}

interface CapitalGainsTax {
    [key: number]: { 
        allowance: number;
        basicRate: number;
        higherRate: number;
    };
}

interface InflationRates {
    [key: number]: number;
}

interface MonthlyInflationIndex {
    [key: number]: {
        [key: number]: number;  // month (0-11) -> index value
    };
}

interface YearlyPrices {
    [key: number]: number;
}

interface RegionalPrices {
    [key: string]: YearlyPrices;
}

interface TaxBracket {
    threshold: number;
    rate: number;
}

interface IncomeTaxRates {
    [key: number]: TaxBracket[];
}

export interface RentalIncomeTaxBand {
  startAmount: number;
  endAmount: number | null;
  rate: number;
}

export interface RentalIncomeTaxYear {
  year: number;
  propertyAllowance: number;
  bands: RentalIncomeTaxBand[];
}

interface MedianSalaryData {
    median_salary: number;
    increase_rate: number;
    salary_index: number;
}

interface MedianSalaries {
    [key: number]: MedianSalaryData;
}

// Define the Region type
export type Region = 'London' | 'South East' | 'East of England' | 'South West' | 'West Midlands' | 'North West';

export const GAME_DATA = {
    // Game Configuration
    config: {
        startYear: 2005,
        startMonth: 0, // January
        startAge: 25,
        endAge: 45,
        startingCash: 15000,
        timePerMonth: 15000, // 15 seconds per month in normal speed
        fastTimePerMonth: 3000, // 3 seconds per month in fast speed
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        regions: ['London', 'South East', 'East of England', 'South West', 'West Midlands', 'North West'] as Region[],
    },
    
    // Monthly Inflation Index (2005-2025)
    inflationIndex: {
        2005: {
            0: 77.0, 1: 77.2, 2: 77.5, 3: 77.8, 4: 78.1, 5: 78.1,
            6: 78.2, 7: 78.4, 8: 78.6, 9: 78.7, 10: 78.7, 11: 78.9
        },
        2006: {
            0: 78.5, 1: 78.8, 2: 78.9, 3: 79.4, 4: 79.9, 5: 80.1,
            6: 80.0, 7: 80.4, 8: 80.5, 9: 80.6, 10: 80.8, 11: 81.3
        },
        2007: {
            0: 80.6, 1: 81.0, 2: 81.4, 3: 81.6, 4: 81.8, 5: 82.0,
            6: 81.5, 7: 81.8, 8: 81.9, 9: 82.3, 10: 82.5, 11: 83.0
        },
        2008: {
            0: 82.4, 1: 83.0, 2: 83.4, 3: 84.0, 4: 84.6, 5: 85.2,
            6: 85.1, 7: 85.7, 8: 86.1, 9: 85.9, 10: 85.8, 11: 85.5
        },
        2009: {
            0: 84.9, 1: 85.6, 2: 85.8, 3: 86.0, 4: 86.4, 5: 86.7,
            6: 86.7, 7: 87.0, 8: 87.1, 9: 87.2, 10: 87.5, 11: 88.0
        },
        2010: {
            0: 87.8, 1: 88.2, 2: 88.7, 3: 89.2, 4: 89.4, 5: 89.5,
            6: 89.3, 7: 89.8, 8: 89.8, 9: 90.0, 10: 90.3, 11: 91.2
        },
        2011: {
            0: 91.3, 1: 92.0, 2: 92.2, 3: 93.2, 4: 93.4, 5: 93.3,
            6: 93.3, 7: 93.8, 8: 94.4, 9: 94.5, 10: 94.6, 11: 95.1
        },
        2012: {
            0: 94.6, 1: 95.1, 2: 95.4, 3: 96.0, 4: 95.9, 5: 95.5,
            6: 95.6, 7: 96.1, 8: 96.5, 9: 97.0, 10: 97.2, 11: 97.6
        },
        2013: {
            0: 97.1, 1: 97.8, 2: 98.1, 3: 98.3, 4: 98.5, 5: 98.3,
            6: 98.3, 7: 98.7, 8: 99.1, 9: 99.1, 10: 99.2, 11: 99.6
        },
        2014: {
            0: 99.0, 1: 99.5, 2: 99.7, 3: 100.1, 4: 100.0, 5: 100.2,
            6: 99.9, 7: 100.2, 8: 100.3, 9: 100.4, 10: 100.1, 11: 100.1
        },
        2015: {
            0: 99.3, 1: 99.5, 2: 99.7, 3: 99.9, 4: 100.1, 5: 100.2,
            6: 100.0, 7: 100.3, 8: 100.2, 9: 100.3, 10: 100.3, 11: 100.3
        },
        2016: {
            0: 99.5, 1: 99.8, 2: 100.2, 3: 100.2, 4: 100.4, 5: 100.6,
            6: 100.6, 7: 100.9, 8: 101.1, 9: 101.2, 10: 101.4, 11: 101.9
        },
        2017: {
            0: 101.4, 1: 102.1, 2: 102.5, 3: 102.9, 4: 103.3, 5: 103.3,
            6: 103.2, 7: 103.8, 8: 104.1, 9: 104.2, 10: 104.6, 11: 104.9
        },
        2018: {
            0: 104.4, 1: 104.9, 2: 105.0, 3: 105.4, 4: 105.8, 5: 105.8,
            6: 105.8, 7: 106.5, 8: 106.6, 9: 106.7, 10: 107.0, 11: 107.1
        },
        2019: {
            0: 106.3, 1: 106.8, 2: 107.0, 3: 107.6, 4: 107.9, 5: 107.9,
            6: 107.9, 7: 108.4, 8: 108.5, 9: 108.3, 10: 108.5, 11: 108.5
        },
        2020: {
            0: 108.2, 1: 108.6, 2: 108.6, 3: 108.5, 4: 108.5, 5: 108.6,
            6: 109.1, 7: 108.6, 8: 109.1, 9: 109.1, 10: 108.9, 11: 109.2
        },
        2021: {
            0: 109.0, 1: 109.1, 2: 109.4, 3: 110.1, 4: 110.8, 5: 111.3,
            6: 111.3, 7: 112.1, 8: 112.4, 9: 113.6, 10: 114.5, 11: 115.1
        },
        2022: {
            0: 114.9, 1: 115.8, 2: 117.1, 3: 120.0, 4: 120.8, 5: 121.8,
            6: 122.5, 7: 123.1, 8: 123.8, 9: 126.2, 10: 126.7, 11: 127.2
        },
        2023: {
            0: 126.4, 1: 127.9, 2: 128.9, 3: 130.4, 4: 131.3, 5: 131.5,
            6: 130.9, 7: 131.3, 8: 132.0, 9: 132.0, 10: 131.7, 11: 132.2
        },
        2024: {
            0: 131.5, 1: 132.3, 2: 133.0, 3: 133.5, 4: 133.9, 5: 134.1,
            6: 133.8, 7: 134.3, 8: 134.2, 9: 135.0, 10: 135.1, 11: 135.6
        },
        2025: {
            0: 135.4
        }
    } as MonthlyInflationIndex,
    
    
    // Detailed historical interest rates
    detailedInterestRates: {
        rates: [
            { date: '2025-05-08', rate: 4.25 },
            { date: '2025-02-06', rate: 4.50 },
            { date: '2024-11-07', rate: 4.75 },
            { date: '2024-08-01', rate: 5.00 },
            { date: '2023-08-03', rate: 5.25 },
            { date: '2023-06-22', rate: 5.00 },
            { date: '2023-05-11', rate: 4.50 },
            { date: '2023-03-23', rate: 4.25 },
            { date: '2023-02-02', rate: 4.00 },
            { date: '2022-12-15', rate: 3.50 },
            { date: '2022-11-03', rate: 3.00 },
            { date: '2022-09-22', rate: 2.25 },
            { date: '2022-08-04', rate: 1.75 },
            { date: '2022-06-16', rate: 1.25 },
            { date: '2022-05-05', rate: 1.00 },
            { date: '2022-03-17', rate: 0.75 },
            { date: '2022-02-03', rate: 0.50 },
            { date: '2021-12-16', rate: 0.25 },
            { date: '2020-03-19', rate: 0.10 },
            { date: '2020-03-11', rate: 0.25 },
            { date: '2018-08-02', rate: 0.75 },
            { date: '2017-11-02', rate: 0.50 },
            { date: '2016-08-04', rate: 0.25 },
            { date: '2009-03-05', rate: 0.50 },
            { date: '2009-02-05', rate: 1.00 },
            { date: '2009-01-08', rate: 1.50 },
            { date: '2008-12-04', rate: 2.00 },
            { date: '2008-11-06', rate: 3.00 },
            { date: '2008-10-08', rate: 4.50 },
            { date: '2008-04-10', rate: 5.00 },
            { date: '2008-02-07', rate: 5.25 },
            { date: '2007-12-06', rate: 5.50 },
            { date: '2007-07-05', rate: 5.75 },
            { date: '2007-05-10', rate: 5.50 },
            { date: '2007-01-11', rate: 5.25 },
            { date: '2006-11-09', rate: 5.00 },
            { date: '2006-08-03', rate: 4.75 },
            { date: '2005-08-04', rate: 4.50 },
            { date: '2004-08-05', rate: 4.75 }
        ]
    } as DetailedInterestRates,
    
    // Capital Gains Tax rates (UK)
    capitalGainsTax: {
        // Simplified CGT rates and allowances by tax year
        2005: { allowance: 8500, basicRate: 0.20, higherRate: 0.40 },
        2010: { allowance: 10100, basicRate: 0.18, higherRate: 0.28 },
        2015: { allowance: 11100, basicRate: 0.18, higherRate: 0.28 },
        2020: { allowance: 12300, basicRate: 0.10, higherRate: 0.20 },
        2024: { allowance: 3000, basicRate: 0.10, higherRate: 0.20 }
    } as CapitalGainsTax,
    
    // Stamp Duty Land Tax rates (UK)
    stampDuty: {
        2005: {
            standardRates: [
                { threshold: 0, rate: 0 },
                { threshold: 120000, rate: 0.01 },
                { threshold: 250000, rate: 0.03 },
                { threshold: 500000, rate: 0.04 }
            ],
            additionalPropertySurcharge: 0.03
        },
        2010: {
            standardRates: [
                { threshold: 0, rate: 0 },
                { threshold: 125000, rate: 0.01 },
                { threshold: 250000, rate: 0.03 },
                { threshold: 500000, rate: 0.04 }
            ],
            additionalPropertySurcharge: 0.03
        },
        2015: {
            standardRates: [
                { threshold: 0, rate: 0 },
                { threshold: 125000, rate: 0.02 },
                { threshold: 250000, rate: 0.05 },
                { threshold: 925000, rate: 0.10 },
                { threshold: 1500000, rate: 0.12 }
            ],
            additionalPropertySurcharge: 0.03
        },
        2020: {
            standardRates: [
                { threshold: 0, rate: 0 },
                { threshold: 500000, rate: 0.05 },
                { threshold: 925000, rate: 0.10 },
                { threshold: 1500000, rate: 0.12 }
            ],
            additionalPropertySurcharge: 0.03
        },
        2024: {
            standardRates: [
                { threshold: 0, rate: 0 },
                { threshold: 250000, rate: 0.05 },
                { threshold: 925000, rate: 0.10 },
                { threshold: 1500000, rate: 0.12 }
            ],
            additionalPropertySurcharge: 0.03
        }
    } as Record<number, {
        standardRates: Array<{threshold: number, rate: number}>,
        additionalPropertySurcharge: number
    }>,
    
    // Inflation Data (CPI)
    inflation: {
        // Yearly average inflation rates
        2005: 2.1, 2006: 2.3, 2007: 2.3, 2008: 3.6, 2009: 2.2,
        2010: 3.3, 2011: 4.5, 2012: 2.8, 2013: 2.6, 2014: 1.5,
        2015: 0.0, 2016: 0.7, 2017: 2.7, 2018: 2.5, 2019: 1.8,
        2020: 0.9, 2021: 2.6, 2022: 9.1, 2023: 7.0, 2024: 3.2
    } as InflationRates,
    
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
    } as RegionalPrices,
    
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
    } as RegionalPrices,
    
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
    } as RegionalPrices,
    
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
    } as IncomeTaxRates,
    

    // Random Events
    events: [
        {
            id: 'fire',
            name: 'House Fire',
            description: 'A fire has damaged your property!',
            probability: 0.002, // Base 0.2% chance per month
            effect: (player: any) => {
                if (player.properties.length > 0) {
                    // Process each property individually
                    for (const property of player.properties) {
                        // Adjust probability based on condition
                        // Properties in poor condition (below 5) have increased fire risk
                        // Properties in good condition (above 7) have decreased fire risk
                        const conditionModifier = (7 - property.condition) * 0.001; // 0.1% change per point difference from 7
                        const finalProbability = 0.002 + conditionModifier;

                        if (Math.random() < finalProbability) {
                            const damage = property.value * (0.15 + (7 - property.condition) * 0.02); // More damage for worse condition
                            if (player.insurance.home) {
                                return {
                                    message: `Your property at ${property.location} had a fire, but insurance covered most of the damage. You paid a £500 excess. Property condition decreased by 2 points.`,
                                    type: 'negative',
                                    cashChange: -500,
                                    propertyEffect: {
                                        id: property.id,
                                        conditionChange: -2
                                    }
                                };
                            } else {
                                return {
                                    message: `Your property at ${property.location} had a fire! Repairs cost £${damage.toFixed(0)}. Property condition decreased by 2 points.`,
                                    type: 'negative',
                                    cashChange: -damage,
                                    propertyEffect: {
                                        id: property.id,
                                        conditionChange: -2
                                    }
                                };
                            }
                        }
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
            effect: (player: any) => {
                const cost = 500 + Math.random() * 2000;
                if (player.insurance.health) {
                    return {
                        message: `You had a medical emergency. Your health insurance covered most costs, but you paid £200 excess.`,
                        type: 'negative',
                        cashChange: -200
                    };
                } else {
                    return {
                        message: `You had a medical emergency and had to pay £${cost.toFixed(0)} in medical bills.`,
                        type: 'negative',
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
            effect: (player: any) => {
                const monthsWithoutJob = 1 + Math.floor(Math.random() * 3);
                return {
                    message: `You lost your job and will be without income for ${monthsWithoutJob} months.`,
                    type: 'negative',
                    jobLoss: monthsWithoutJob
                };
            }
        },
        {
            id: 'market_crash',
            name: 'Stock Market Crash',
            description: 'The stock market crashed!',
            probability: 0.001, // 0.1% chance per month
            effect: (player: any) => {
                return {
                    message: `A stock market crash has occurred! Your stock portfolio value has dropped significantly.`,
                    type: 'negative',
                    marketCrash: true
                };
            }
        },
        {
            id: 'divorce',
            name: 'Divorce',
            description: 'Your marriage ended in divorce.',
            probability: 0.001, // 0.1% chance per month
            effect: (player: any) => {
                if (player.married) {
                    return {
                        message: `Your marriage has ended in divorce. Half of your assets will be divided.`,
                        type: 'negative',
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
            effect: (player: any) => {
                if (player.car) {
                    const damage = player.car.value * 0.2;
                    if (player.insurance.car) {
                        return {
                            message: `You had a car accident, but insurance covered most of the damage. You paid a £250 excess.`,
                            type: 'negative',
                            cashChange: -250
                        };
                    } else {
                        return {
                            message: `You had a car accident! Repairs cost £${damage.toFixed(0)}.`,
                            type: 'negative',
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
            probability: 0.003, // Base 0.3% chance per month
            effect: (player: any) => {
                if (player.properties.length > 0) {
                    // Process each property individually
                    for (const property of player.properties) {
                        // Adjust probability based on condition
                        // Properties in poor condition have much higher repair needs
                        const conditionModifier = Math.max(0, (7 - property.condition) * 0.002); // 0.2% increase per point below 7
                        const finalProbability = 0.003 + conditionModifier;

                        if (Math.random() < finalProbability) {
                            // Repair cost increases for properties in worse condition
                            const baseRepairCost = property.value * 0.03;
                            const conditionMultiplier = 1 + Math.max(0, (7 - property.condition) * 0.2); // 20% more per point below 7
                            const repairCost = baseRepairCost * conditionMultiplier;

                            // Improve condition slightly after repairs
                            const conditionImprovement = Math.min(2, 10 - property.condition);

                            return {
                                message: `Your property at ${property.location} needs urgent repairs costing £${repairCost.toFixed(0)}. Property condition improved by ${conditionImprovement} points after repairs.`,
                                type: 'negative',
                                cashChange: -repairCost,
                                propertyEffect: {
                                    id: property.id,
                                    conditionChange: conditionImprovement
                                }
                            };
                        }
                    }
                }
                return null;
            }
        },
        {
            id: 'child',
            name: 'Unexpected Child',
            description: 'You have a child!',
            probability: 0.001, // 0.1% chance per month
            effect: (player: any) => {
                if (player.age >= 25 && player.age <= 40) {
                    return {
                        message: `Congratulations! You have a child. This will increase your monthly expenses by £500.`,
                        type: 'positive',
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
            effect: (player: any) => {
                const amount = 5000 + Math.random() * 20000;
                return {
                    message: `You received an inheritance of £${amount.toFixed(0)}.`,
                    type: 'positive',
                    cashChange: amount
                };
            }
        },
        {
            id: 'theft',
            name: 'Theft',
            description: 'You were a victim of theft!',
            probability: 0.002, // 0.2% chance per month
            effect: (player: any) => {
                const amount = 500 + Math.random() * 1500;
                if (player.insurance.contents) {
                    return {
                        message: `You were a victim of theft, but your contents insurance covered most of the loss. You paid a £100 excess.`,
                        type: 'negative',
                        cashChange: -100
                    };
                } else {
                    return {
                        message: `You were a victim of theft and lost £${amount.toFixed(0)}.`,
                        type: 'negative',
                        cashChange: -amount
                    };
                }
            }
        }
    ],

    // Transport cost multipliers by region (London as baseline)
    transportCostMultiplier: {
        'London': 0.8,        // Best public transport, lowest costs
        'South East': 1.0,    // Good connections to London
        'East of England': 1.1,
        'South West': 1.2,
        'West Midlands': 1.1,
        'North West': 1.2     // More reliance on private transport
    } as const satisfies Record<Region, number>,

    rentalIncomeTaxData: [
        {
            year: 2024,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 12570, rate: 0 },
                { startAmount: 12571, endAmount: 50270, rate: 20 },
                { startAmount: 50271, endAmount: 125140, rate: 40 },
                { startAmount: 125141, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2023,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 12570, rate: 0 },
                { startAmount: 12571, endAmount: 50270, rate: 20 },
                { startAmount: 50271, endAmount: 125140, rate: 40 },
                { startAmount: 125141, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2022,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 12570, rate: 0 },
                { startAmount: 12571, endAmount: 50270, rate: 20 },
                { startAmount: 50271, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2021,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 12570, rate: 0 },
                { startAmount: 12571, endAmount: 50270, rate: 20 },
                { startAmount: 50271, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2020,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 12500, rate: 0 },
                { startAmount: 12501, endAmount: 50000, rate: 20 },
                { startAmount: 50001, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2019,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 12500, rate: 0 },
                { startAmount: 12501, endAmount: 50000, rate: 20 },
                { startAmount: 50001, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2018,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 11850, rate: 0 },
                { startAmount: 11851, endAmount: 46350, rate: 20 },
                { startAmount: 46351, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2017,
            propertyAllowance: 1000,
            bands: [
                { startAmount: 0, endAmount: 11500, rate: 0 },
                { startAmount: 11501, endAmount: 45000, rate: 20 },
                { startAmount: 45001, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2016,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 11000, rate: 0 },
                { startAmount: 11001, endAmount: 43000, rate: 20 },
                { startAmount: 43001, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2015,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 10600, rate: 0 },
                { startAmount: 10601, endAmount: 42385, rate: 20 },
                { startAmount: 42386, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2014,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 10000, rate: 0 },
                { startAmount: 10001, endAmount: 41865, rate: 20 },
                { startAmount: 41866, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2013,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 9440, rate: 0 },
                { startAmount: 9441, endAmount: 41450, rate: 20 },
                { startAmount: 41451, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 45 }
            ]
        },
        {
            year: 2012,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 8105, rate: 0 },
                { startAmount: 8106, endAmount: 42475, rate: 20 },
                { startAmount: 42476, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 50 }
            ]
        },
        {
            year: 2011,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 7475, rate: 0 },
                { startAmount: 7476, endAmount: 35000, rate: 20 },
                { startAmount: 35001, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 50 }
            ]
        },
        {
            year: 2010,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 6475, rate: 0 },
                { startAmount: 6476, endAmount: 37400, rate: 20 },
                { startAmount: 37401, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 50 }
            ]
        },
        {
            year: 2009,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 6475, rate: 0 },
                { startAmount: 6476, endAmount: 37400, rate: 20 },
                { startAmount: 37401, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 40 }
            ]
        },
        {
            year: 2008,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 6035, rate: 0 },
                { startAmount: 6036, endAmount: 34800, rate: 20 },
                { startAmount: 34801, endAmount: 150000, rate: 40 },
                { startAmount: 150001, endAmount: null, rate: 40 }
            ]
        },
        {
            year: 2007,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 5225, rate: 0 },
                { startAmount: 5226, endAmount: 33300, rate: 22 },
                { startAmount: 33301, endAmount: null, rate: 40 }
            ]
        },
        {
            year: 2006,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 4895, rate: 0 },
                { startAmount: 4896, endAmount: 33300, rate: 22 },
                { startAmount: 33301, endAmount: null, rate: 40 }
            ]
        },
        {
            year: 2005,
            propertyAllowance: 0,
            bands: [
                { startAmount: 0, endAmount: 4745, rate: 0 },
                { startAmount: 4746, endAmount: 32400, rate: 22 },
                { startAmount: 32401, endAmount: null, rate: 40 }
            ]
        }
    ],

    // Median Salary Data by Year (UK)
    medianSalaries: {
        2005: { median_salary: 33598.50, increase_rate: 1.000000000, salary_index: 1.000000000 },
        2006: { median_salary: 35288.40, increase_rate: 1.050296888, salary_index: 1.050296888 },
        2007: { median_salary: 36767.20, increase_rate: 1.041906122, salary_index: 1.094310758 },
        2008: { median_salary: 37077.10, increase_rate: 1.008428708, salary_index: 1.103534384 },
        2009: { median_salary: 35479.00, increase_rate: 0.956897924, salary_index: 1.055969761 },
        2010: { median_salary: 36379.20, increase_rate: 1.025372756, salary_index: 1.082762623 },
        2011: { median_salary: 37363.80, increase_rate: 1.027064916, salary_index: 1.112067503 },
        2012: { median_salary: 38511.10, increase_rate: 1.030706192, salary_index: 1.146214861 },
        2013: { median_salary: 40232.70, increase_rate: 1.044703994, salary_index: 1.197455244 },
        2014: { median_salary: 41584.00, increase_rate: 1.033587107, salary_index: 1.237674301 },
        2015: { median_salary: 42928.50, increase_rate: 1.032332147, salary_index: 1.277690968 },
        2016: { median_salary: 44606.10, increase_rate: 1.039078934, salary_index: 1.327621769 },
        2017: { median_salary: 46553.50, increase_rate: 1.043657706, salary_index: 1.385582690 },
        2018: { median_salary: 48163.70, increase_rate: 1.034588162, salary_index: 1.433507448 },
        2019: { median_salary: 49575.60, increase_rate: 1.029314608, salary_index: 1.475530158 },
        2020: { median_salary: 45329.10, increase_rate: 0.914342943, salary_index: 1.349140587 },
        2021: { median_salary: 50522.70, increase_rate: 1.114575405, salary_index: 1.503718916 },
        2022: { median_salary: 55862.10, increase_rate: 1.105683188, salary_index: 1.662636725 },
        2023: { median_salary: 57821.90, increase_rate: 1.035082820, salary_index: 1.720966710 },
        2024: { median_salary: 59160.00, increase_rate: 1.023141751, salary_index: 1.760792893 }
    } as MedianSalaries
} as const; 

// Function to get interest rate for a specific date
export function getInterestRate(date: Date): number {
    const targetDate = date.toISOString().split('T')[0];
    
    // Find the most recent rate that is less than or equal to the target date
    const rate = GAME_DATA.detailedInterestRates.rates.find(rate => {
        return rate.date <= targetDate;
    });
    
    // If no rate found (date is before earliest rate), return the earliest rate
    if (!rate) {
        return GAME_DATA.detailedInterestRates.rates[GAME_DATA.detailedInterestRates.rates.length - 1].rate;
    }
    
    return rate.rate;
}

// Function to get interest rate for a specific year and month
export function getInterestRateForYearMonth(year: number, month: number): number {
    const date = new Date(year, month);
    return getInterestRate(date);
}

// Function to calculate Stamp Duty Land Tax
export function calculateStampDuty(price: number, year: number, isAdditionalProperty: boolean = false): number {
    // Find the closest available tax year that's not greater than the current year
    const taxYears = Object.keys(GAME_DATA.stampDuty).map(Number);
    let closestYear = taxYears[0];
    
    for (const taxYear of taxYears) {
        if (taxYear <= year && taxYear > closestYear) {
            closestYear = taxYear;
        }
    }
    
    const { standardRates, additionalPropertySurcharge } = GAME_DATA.stampDuty[closestYear];
    let totalTax = 0;
    
    // Calculate tax for each bracket
    for (let i = 1; i < standardRates.length; i++) {
        const currentBracket = standardRates[i];
        const prevBracket = standardRates[i - 1];
        
        if (price > prevBracket.threshold) {
            const amountInBracket = Math.min(
                price - prevBracket.threshold,
                (currentBracket.threshold - prevBracket.threshold) || Infinity
            );
            totalTax += amountInBracket * currentBracket.rate;
        }
    }
    
    // Add additional property surcharge if applicable
    if (isAdditionalProperty) {
        totalTax += price * additionalPropertySurcharge;
    }
    
    return Math.round(totalTax);
}