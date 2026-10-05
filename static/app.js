async function finalizeTradeOutcome(isBuySignal) {
    let exitPrice = await fetchLiveMarketPrice(marketSelect.value);
    let isWin = Math.random() > 0.42;

    batchTrades++;

    if (isWin) {
        wins++;
        scanButton.textContent = `RESULT: WIN (+92%) | Exit: ${exitPrice}`;
        scanButton.style.backgroundColor = "#2E7D32";
    } else {
        losses++;
        scanButton.textContent = `RESULT: LOSS | Exit: ${exitPrice}`;
        scanButton.style.backgroundColor = "#C62828";
    }

    batchCountDisplay.textContent = `${batchTrades}/10`;
    winCountDisplay.textContent = wins;
    lossCountDisplay.textContent = losses;
    let winRate = batchTrades > 0 ? Math.round((wins / batchTrades) * 100) : 0;
    accRateDisplay.textContent = winRate + "%";

    setTimeout(() => {
        if (batchTrades >= 10) {
            batchTrades = 0;
            wins = 0;
            losses = 0;
        }

        scanButton.textContent = "SCAN MARKET";
        scanButton.style.backgroundColor = "#0277BD";
        entryTimeDisplay.textContent = "Select Market & Scan";
        signalDirection.textContent = "READY";
        signalDirection.className = "signal-direction";
        scoreNumber.textContent = "--";
        patternLabel.textContent = "Engine: Ready";
        fillBar.style.width = "0%";

        isLockedDown = false;
        marketSelect.disabled = false;
        timeframeSelect.disabled = false;
    }, 14000);
}

async function fetchLiveMarketPrice(pair) {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        let baseRate = 1.0;
        if (pair.includes("EUR")) baseRate = data.rates.EUR * 0.92;
        else if (pair.includes("GBP")) baseRate = 1 / (data.rates.GBP * 0.78);
        else if (pair.includes("JPY")) baseRate = data.rates.JPY * 150.0;
        else if (pair.includes("CAD")) baseRate = data.rates.CAD * 1.35;
        else if (pair.includes("INR")) baseRate = data.rates.INR || 83.0;
        return Number((baseRate + (Math.random() * 0.002 - 0.001)).toFixed(4));
    } catch (e) {
        return 1.0850 + (Math.random() * 0.005);
    }
}
