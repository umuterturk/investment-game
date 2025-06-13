## **Game Design Document: Investment Life Simulator**

### **1. Game Overview**

**Title:** Investment Life Simulator
**Genre:** Economic Simulation / Life Strategy
**Platform:** Web (Mobile-Friendly Single Page Game)
**Visual Style:** Retro pixel-art aesthetic (inspired by early 90s PC interfaces)
**Target Audience:** Financial enthusiasts, casual strategy gamers, ages 18–45

**Description:**
Simulate 20 years of adult financial life in the UK, from age 25 to 45. Make real-world investment and lifestyle decisions using historical economic data. Manage your income, investments, and unexpected life events to grow your net worth.

---

### **2. Gameplay Mechanics**

#### **2.1 Time System**

* **Default Speed:** 1 month = 15 seconds
* **Fast Forward:** 1 month = 3 seconds
* **Pause Button**: Halts time and disables changes to markets and recurring actions
* **Controls:** Accessible in **floating header**

#### **2.2 UI Layout**

* **Floating Top Header (always visible):**

  * Current Time (Month/Year)
  * Cash on Hand
  * Total Investment Value
  * Net Worth
  * Game Speed: `⏸ Pause | ▶️ Normal | ⏩ Fast`

* **Main Screen:**

  * **Action Buttons:**

    * Buy/Sell Stocks
    * Buy/Sell Property
    * Deposit/Withdraw from Savings
    * Pay Rent
    * Get Married
    * Buy Car
    * Take/Repay Loans
  * **Information Panels:**

    * Monthly Summary
    * Mini charts (stock/real estate trends)
    * Notifications

* **Design:** Retro pixel fonts, grid layouts, minimal UI inspired by MS-DOS / early Mac interfaces

---

### **3. Economic & Life Simulation**

#### **3.1 Real Data (UK: 2005–2024)**

* **House Prices:** Per sqm, per region (UK Land Registry)
* **Rent Costs:** Monthly per region
* **Stocks:** 10 selected UK stocks with monthly prices
* **Interest Rates:** Historical BoE rates
* **Inflation:** Monthly CPI from ONS
* **Income Tax Brackets:** Annual UK thresholds
* **Salaries:** Avg salary over years
* **Savings Rate:** Returns tied to real interest data

---

### **4. Core Systems**

#### **4.1 Financial Actions**

* **Stocks:**

  * Historical monthly prices
  * No transaction fees
* **Real Estate:**

  * Buy per sqm, set location
  * Monthly rent income
  * Maintenance events
* **Savings:**

  * Earn interest monthly
* **Income:**

  * Monthly salary (with taxation)
* **Recurring Costs:**

  * Rent, utilities, food, car upkeep, marriage
* **Loans:**

  * Fixed rate (dynamic based on historical interest), monthly payments

#### **4.2 Random Events**

Occurs monthly, with % probability:

* 🔥 **House Fire (Insurance mitigates loss)**
* 🚑 **Medical Emergency (health drop + expense)**
* 💼 **Job Loss (temporary income cut)**
* 📈 **Stock Market Crash (price drop)**
* 💔 **Divorce (assets halved if married)**
* 🚗 **Traffic Accident (car damage + cost)**
* 🏚 **Home Repair Needed (maintenance cost)**
* 👶 **Unexpected Child (expense spike)**
* 🎉 **Inheritance (cash bonus)**
* 🔍 **Fraud/Theft (random cash loss unless insurance held)**

---

### **5. Game Progression**

#### **Timeline**

* Start: Age 25 → End: Age 45 (20 years = 240 months)
* Monthly progression with visual timeline marker
* Ending screen with Net Worth summary, top assets, life story log

#### **Victory Conditions**

* Primary: **Highest Net Worth**
* Secondary: Optional badges/achievements (e.g., "Own 5 properties", "Stock wizard", "Debt-free life")

---

### **6. Technical Stack**

* **Frontend:** HTML, CSS (Tailwind or custom retro theme), Vanilla JS or React
* **Mobile-Friendly:** Responsive layout (CSS Grid, Flex), large buttons, auto-scaling text
* **Data Handling:** JSON datasets for time-series data
* **Persistence:** LocalStorage (auto-save & resume)
* **Charting:** `Chart.js` or retro-styled canvas charts
* **Time Engine:** `setInterval` or requestAnimationFrame for update loop, synced to speed

---

### **7. Visual & Audio Style**

* **Visual:** Pixel fonts, low-color palette, outlined UI elements, old terminal screen feel
* **Audio (Optional):**

  * Lo-fi chiptune background music
  * Retro UI click sounds, event sound effects

