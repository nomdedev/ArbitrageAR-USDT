# ArbitrageAR-USDT Project Context

## Overview
**ArbitrageAR-USDT** is a Chrome Extension (Manifest V3) designed to detect and analyze arbitrage opportunities between the Argentine Official Dollar (plus applicable taxes) and USDT markets on local cryptocurrency exchanges. It empowers users to identify profitable routes for "rulo" operations by aggregating real-time data from multiple sources.

## Core Functionality

### 1. Arbitrage Detection
The extension calculates potential profits for various arbitrage routes:
- **Simple Routes (Intra-Exchange):** Buy USD (Bank) → Buy USDT (Exchange A) → Sell USDT (Exchange A) → ARS.
- **Inter-Broker Routes:** Buy USD (Bank) → Buy USDT (Exchange A) → Transfer USDT → Sell USDT (Exchange B) → ARS.
- **P2P Detection:** Identifies and filters routes involving Peer-to-Peer markets, which carry different risks and speeds.

### 2. Data Aggregation & Normalization
The system aggregates data from multiple external APIs to ensure accuracy and redundancy:
- **CriptoYa API:** Primary source for USDT/ARS and USDT/USD order book data, and bank rates.
- **DolarAPI:** Source for official dollar rates.
- **Dolarito:** Secondary source for bank quotations.
- **Bank Consensus:** Calculates a realistic "Official Dollar" buy price by aggregating ask prices from major banks (Galicia, Santander, BBVA, ICBC, BNA) using methods like consensus, average, or best price.

### 3. Simulation & Analysis
- **Investment Simulator:** Allows users to input a specific capital amount (ARS) to simulate net returns after all fees.
- **Fee Calculation:** Takes into account:
  - Exchange trading fees (maker/taker).
  - Bank commission fees.
  - Crypto withdrawal/transfer fees.
  - Taxes on foreign currency purchases.

### 4. User Safety & Validation
- **Risk Assessment:** Analyzes routes for potential risks (high volatility, low liquidity, P2P involvement).
- **Data Freshness:** Alerts users if market data is stale (> 5 minutes).
- **Sanity Checks:** Validates calculations to prevent displaying erroneous profit margins (e.g., >50% unrealistic returns).

## Architecture

The project follows a standard **Chrome Extension Manifest V3** architecture:

### Components

1.  **Background Service Worker (`src/background/main-simple.js`)**
    -   **Role:** The brain of the extension. Runs persistently in the background.
    -   **Responsibilities:**
        -   Scheduling data fetches (Alarms API).
        -   Executing core arbitrage calculations (CPU-intensive).
        -   Managing data caching to respect API rate limits.
        -   Broadcasting updates to the UI.

2.  **Data Layer (`src/DataService.js`)**
    -   **Role:** Abstraction layer for external API interactions.
    -   **Responsibilities:**
        -   Fetching data from CriptoYa, DolarAPI, etc.
        -   Implementing rate limiting and timeout logic.
        -   Normalizing disparate data formats into a unified schema.

3.  **Validation Layer (`src/ValidationService.js`)**
    -   **Role:** Security and integrity guard.
    -   **Responsibilities:**
        -   Verifying data freshness.
        -   Calculating risk scores for routes.
        -   Validating mathematical consistency of arbitrage routes.

4.  **User Interface**
    -   **Popup (`src/popup.html`, `src/popup.js`):**
        -   Main dashboard.
        -   Displays optimized arbitrage routes.
        -   Tabs for: Opportunities, Bank Rates, Simulator.
        -   Real-time filtering (P2P, Profit %, Exchanges).
    -   **Options (`src/options.html`, `src/options.js`):**
        -   Configuration page.
        -   Settings for: Notifications, Fees, Preferred Exchanges, API URLs.

### Data Flow
1.  **Fetch:** `DataService` retrieves raw market data.
2.  **Process:** `Background` worker normalizes data and calculates the "Official Dollar" consensus price.
3.  **Compute:** `Background` worker generates all possible permutations of routes (Simple & Inter-broker).
4.  **Validate:** `ValidationService` checks routes for errors and assigns risk levels.
5.  **Display:** `Popup` requests the latest processed data from `Background` and renders it for the user.

## Key Files & Directories

-   **`manifest.json`**: Extension configuration (permissions, host permissions, background scripts).
-   **`src/background/main-simple.js`**: Core logic and scheduler.
-   **`src/DataService.js`**: API interaction service.
-   **`src/ValidationService.js`**: Logic for data validity and risk assessment.
-   **`src/popup.js`**: UI logic for the main extension popup.
-   **`src/options.js`**: Logic for the settings page.
-   **`src/utils.js`**: Shared utility functions (formatting, etc.).

## Technology Stack
-   **Core:** Vanilla JavaScript (ES6+).
-   **UI:** HTML5, CSS3 (Custom styles, no framework).
-   **Platform:** Chrome Extensions API (Manifest V3).
-   **External APIs:** CriptoYa, DolarAPI, Dolarito.
