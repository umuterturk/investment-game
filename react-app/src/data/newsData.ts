// Historical News Events System
export const NEWS_EVENTS = [
    // 2007-2008 Financial Crisis
    {
        date: { year: 2007, month: 7 }, // August 2007
        title: "Credit Crunch Begins",
        content: "Banks are becoming increasingly reluctant to lend to each other as the subprime mortgage crisis in the US intensifies."
    },
    {
        date: { year: 2007, month: 8 }, // September 2007
        title: "Northern Rock Seeks Emergency Funding",
        content: "UK bank Northern Rock has approached the Bank of England for emergency funding, triggering the first bank run in the UK since Victorian times."
    },
    {
        date: { year: 2008, month: 8 }, // September 2008
        title: "Lehman Brothers Collapses",
        content: "US investment bank Lehman Brothers has filed for bankruptcy, marking the largest bankruptcy filing in US history."
    },
    {
        date: { year: 2008, month: 9 }, // October 2008
        title: "Government Bails Out UK Banks",
        content: "The UK government has announced a £500 billion bank rescue package to stabilize the financial system."
    },
    {
        date: { year: 2009, month: 2 }, // March 2009
        title: "Stock Market Hits Bottom",
        content: "Global stock markets have reached their lowest point since the financial crisis began, with the FTSE 100 down over 40% from its peak."
    },

    // Eurozone Crisis
    {
        date: { year: 2010, month: 4 }, // May 2010
        title: "Greece Receives First Bailout",
        content: "Greece has received a €110 billion bailout from the EU and IMF to avoid defaulting on its debt."
    },
    {
        date: { year: 2011, month: 10 }, // November 2011
        title: "Eurozone Crisis Deepens",
        content: "Italy's borrowing costs have soared to record levels, raising fears that Europe's third-largest economy may need a bailout."
    },
    {
        date: { year: 2012, month: 6 }, // July 2012
        title: "ECB Pledges to Save the Euro",
        content: "European Central Bank President Mario Draghi has pledged to do 'whatever it takes' to preserve the euro, calming markets."
    },

    // UK Specific Events
    {
        date: { year: 2013, month: 3 }, // April 2013
        title: "UK Avoids Triple-Dip Recession",
        content: "The UK economy has grown by 0.3% in the first quarter of 2013, avoiding a triple-dip recession."
    },
    {
        date: { year: 2014, month: 8 }, // September 2014
        title: "Scotland Votes to Remain in UK",
        content: "Scotland has voted to remain part of the United Kingdom in a historic referendum, with 55% voting against independence."
    },
    {
        date: { year: 2016, month: 5 }, // June 2016
        title: "UK Votes to Leave EU",
        content: "The UK has voted to leave the European Union in a historic referendum, with 52% voting in favor of Brexit."
    },
    {
        date: { year: 2016, month: 6 }, // July 2016
        title: "Pound Falls After Brexit Vote",
        content: "The pound has fallen to a 31-year low against the dollar following the UK's vote to leave the EU."
    },
    {
        date: { year: 2017, month: 2 }, // March 2017
        title: "UK Triggers Article 50",
        content: "The UK has officially triggered Article 50, starting the two-year process of leaving the European Union."
    },
    {
        date: { year: 2019, month: 6 }, // July 2019
        title: "Boris Johnson Becomes PM",
        content: "Boris Johnson has become the UK's new Prime Minister, promising to deliver Brexit by the end of October."
    },
    {
        date: { year: 2020, month: 0 }, // January 2020
        title: "UK Officially Leaves the EU",
        content: "The UK has officially left the European Union after 47 years of membership, entering a transition period until the end of the year."
    },

    // COVID-19 Pandemic
    {
        date: { year: 2020, month: 0 }, // January 2020
        title: "New Virus Emerges in China",
        content: "A new coronavirus has emerged in Wuhan, China, with cases beginning to spread globally."
    },
    {
        date: { year: 2020, month: 2 }, // March 2020
        title: "COVID-19 Declared a Pandemic",
        content: "The World Health Organization has declared COVID-19 a global pandemic as cases surge worldwide."
    },
    {
        date: { year: 2020, month: 2 }, // March 2020
        title: "UK Enters First Lockdown",
        content: "The UK has entered a nationwide lockdown to slow the spread of COVID-19, with all non-essential businesses closing."
    },
    {
        date: { year: 2020, month: 2 }, // March 2020
        title: "Stock Markets Crash",
        content: "Global stock markets have experienced their worst day since the 2008 financial crisis due to COVID-19 fears."
    },
    {
        date: { year: 2020, month: 3 }, // April 2020
        title: "UK Furlough Scheme Launched",
        content: "The UK government has launched the Coronavirus Job Retention Scheme, paying 80% of wages for furloughed workers."
    },
    {
        date: { year: 2020, month: 11 }, // December 2020
        title: "COVID-19 Vaccine Approved",
        content: "The UK has become the first country to approve the Pfizer/BioNTech COVID-19 vaccine for widespread use."
    },
    {
        date: { year: 2021, month: 0 }, // January 2021
        title: "Third National Lockdown",
        content: "The UK has entered a third national lockdown as COVID-19 cases surge due to a new variant."
    },
    {
        date: { year: 2021, month: 6 }, // July 2021
        title: "Freedom Day",
        content: "Most COVID-19 restrictions have been lifted in England, despite rising cases of the Delta variant."
    },
    {
        date: { year: 2022, month: 1 }, // February 2022
        title: "All COVID Restrictions End",
        content: "All remaining COVID-19 restrictions have been lifted in England, including the legal requirement to self-isolate."
    },

    // Inflation and Cost of Living Crisis
    {
        date: { year: 2021, month: 9 }, // October 2021
        title: "Energy Prices Surge",
        content: "UK energy prices are surging due to global supply issues, with many suppliers going out of business."
    },
    {
        date: { year: 2022, month: 1 }, // February 2022
        title: "Russia Invades Ukraine",
        content: "Russia has launched a full-scale invasion of Ukraine, leading to concerns about energy supplies and further inflation."
    },
    {
        date: { year: 2022, month: 3 }, // April 2022
        title: "Inflation Hits 30-Year High",
        content: "UK inflation has hit 7%, its highest rate in 30 years, driven by energy and food prices."
    },
    {
        date: { year: 2022, month: 8 }, // September 2022
        title: "Mini-Budget Turmoil",
        content: "The UK government's mini-budget has caused turmoil in financial markets, with the pound falling to a record low against the dollar."
    },
    {
        date: { year: 2022, month: 9 }, // October 2022
        title: "Liz Truss Resigns",
        content: "Liz Truss has resigned as UK Prime Minister after just 45 days in office, following market turmoil caused by her economic policies."
    },
    {
        date: { year: 2023, month: 0 }, // January 2023
        title: "Inflation Begins to Fall",
        content: "UK inflation has begun to fall from its peak, but remains well above the Bank of England's 2% target."
    },
    {
        date: { year: 2023, month: 11 }, // December 2023
        title: "Inflation Approaches Target",
        content: "UK inflation has fallen to 3.9%, approaching the Bank of England's 2% target, raising hopes of interest rate cuts in 2024."
    }
]; 