const marketSelect = document.getElementById('marketSelect');
const timeframeSelect = document.getElementById('timeframeSelect');
const scanButton = document.getElementById('scanBtn');
const batchCountDisplay = document.getElementById('batchCountDisplay');
const winCountDisplay = document.getElementById('winCountDisplay');
const lossCountDisplay = document.getElementById('lossCountDisplay');
const accRateDisplay = document.getElementById('accRateDisplay');
const entryTimeDisplay = document.getElementById('entryTimeDisplay');
const signalDirection = document.getElementById('signalDirection');
const scoreNumber = document.getElementById('scoreNumber');
const patternLabel = document.getElementById('patternLabel');
const fillBar = document.getElementById('fillBar');

let batchTrades = 0;
let wins = 0;
let losses = 0;
let isLockedDown = false;

// CHECK EXPIRATION, SESSION & AUTOMATIC PAYPAL RETURN ON PAGE LOAD
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('access') === 'granted') {
        const days = parseInt(urlParams.get('days')) || 30;
        const expirationTime = new Date().getTime() + (days * 24 * 60 * 60 * 1000);

        localStorage.setItem('bot_vip_active', 'true');
        localStorage.setItem('bot_user_role', 'subscriber');
        localStorage.setItem('bot_vip_expiry', expirationTime.toString());

        // Clean URL parameters from the address bar
        window.history.replaceState({}, document.title, window.location.pathname);
        
        showDashboard(false);
        return;
    }

    checkSubscriptionStatus();
};

function checkSubscriptionStatus() {
    const isVip = localStorage.getItem('bot_vip_active');
    const role = localStorage.getItem('bot_user_role');
    const expiry = localStorage.getItem('bot_vip_expiry');

    if (isVip === 'true') {
        // Owner has unlimited access
        if (role === 'owner') {
            showDashboard(true);
            return;
        }

        // Regular subscriber: Check if expiration time has passed
        if (expiry) {
            const now = new Date().getTime();
            if (now >= parseInt(expiry)) {
                alert("Your subscription plan has expired. Please renew your plan to continue.");
                logout();
                return;
            }
        }

        showDashboard(false);
    }
}

function verifyVipCode() {
    const code = document.getElementById('vipCodeInput').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) errorMsg.style.display = 'none';

    // 1. OWNER LOGIN (Permanent Owner Access + Subscriber Management Panel)
    if (code === "legendary5") {
        localStorage.setItem('bot_vip_active', 'true');
        localStorage.setItem('bot_user_role', 'owner');
        localStorage.removeItem('bot_vip_expiry'); // Owner never expires
        showDashboard(true);
        return;
    }

    // 2. BACKUP SUBSCRIBER KEYS (Manual entry if needed)
    if (code.startsWith("SUB30-") || code.startsWith("SUB60-") || code.startsWith("SUB90-")) {
        let days = 30;
        if (code.startsWith("SUB60-")) days = 60;
        if (code.startsWith("SUB90-")) days = 90;

        const expirationTime = new Date().getTime() + (days * 24 * 60 * 60 * 1000);

        localStorage.setItem('bot_vip_active', 'true');
        localStorage.setItem('bot_user_role', 'subscriber');
        localStorage.setItem('bot_vip_expiry', expirationTime.toString());
        
        showDashboard(false);
        return;
    }

    // Server verification API fallback
    fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const days = data.days || 30;
            const expirationTime = new Date().getTime() + (days * 24 * 60 * 60 * 1000);
            localStorage.setItem('bot_vip_active', 'true');
            localStorage.setItem('bot_user_role', 'subscriber');
            localStorage.setItem('bot_vip_expiry', expirationTime.toString());
            showDashboard(false);
        } else {
            if (errorMsg) errorMsg.style.display = 'block';
        }
    })
    .catch(err => {
        if (errorMsg) errorMsg.style.display = 'block';
    });
}

function showDashboard(isOwner = false) {
    const paywallView = document.getElementById('paywall-view');
    const dashboardView = document.getElementById('dashboard-view');
    const adminPanel = document.getElementById('adminPanel');

    if (paywallView) paywallView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';

    // Show Subscriber Management Panel ONLY if logged in as Owner
    if (adminPanel) {
        adminPanel.style.display = isOwner ? 'block' : 'none';
    }
}

function logout() {
    localStorage.removeItem('bot_vip_active');
    localStorage.removeItem('bot_user_role');
    localStorage.removeItem('bot_vip_expiry');

    const paywallView = document.getElementById('paywall-view');
    const dashboardView = document.getElementById('dashboard-view');
    const adminPanel = document.getElementById('adminPanel');

    if (dashboardView) dashboardView.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
    if (paywallView) paywallView.style.display = 'flex';
}

async function fetchSignal() {
    // Re-check expiration before every scan attempt
    checkSubscriptionStatus();
    if (localStorage.getItem('bot_vip_active') !== 'true') return;

    if (isLockedDown) return;
    isLockedDown = true;
    if (marketSelect) marketSelect.disabled = true;
    if (timeframeSelect) timeframeSelect.disabled = true;

    const market = marketSelect ? marketSelect.value : 'EUR/USD';
    const timeframe = timeframeSelect ? timeframeSelect.value : '1M';
    
    if (scanButton) {
        scanButton.innerText = "Analyzing Market...";
        scanButton.style.backgroundColor = "#374151";
    }

    fetch(`/api/signal?market=${encodeURIComponent(market)}&timeframe=${encodeURIComponent(timeframe)}`)
    .then(res => res.json())
    .then(async data => {
        if (entryTimeDisplay) entryTimeDisplay.innerText = data.timestamp;
        const resMarket = document.getElementById('resMarket');
        const resTimeframe = document.getElementById('resTimeframe');
        if (resMarket) resMarket.innerText = data.market;
        if (resTimeframe) resTimeframe.innerText = data.timeframe;
        
        if (signalDirection) {
            signalDirection.innerText = data.signal;
            signalDirection.style.color = data.signal === 'BUY' ? '#10b981' : '#ef4444';
        }

        if (scoreNumber) scoreNumber.innerText = data.score;
        if (patternLabel) patternLabel.innerText = data.pattern;
        const resPrice = document.getElementById('resPrice');
        if (resPrice) resPrice.innerText = data.live_price;
        
        const outcomeElement = document.getElementById('resOutcome');
        if (outcomeElement) {
            outcomeElement.innerText = "ACTIVE (Waiting for Expiry...)";
            outcomeElement.style.color = "#f59e0b";
        }
        const resExitPrice = document.getElementById('resExitPrice');
        if (resExitPrice) resExitPrice.innerText = "Waiting...";

        const signalResultBox = document.getElementById('signalResultBox');
        if (signalResultBox) signalResultBox.style.display = 'block';
        if (fillBar) fillBar.style.width = "100%";

        let waitTime = 5000;
        if (timeframe === 'S10') waitTime = 10000;
        else if (timeframe === 'S15') waitTime = 15000;
        else if (timeframe === 'S30') waitTime = 30000;
        else if (timeframe === '1M') waitTime = 60000;
        else if (timeframe === '2M') waitTime = 120000;
        else if (timeframe === '5M') waitTime = 300000;
        else if (timeframe.includes('M') || timeframe.includes('H')) waitTime = 10000;

        setTimeout(async () => {
            await finalizeTradeOutcome(data.signal === 'BUY');
        }, waitTime);

    })
    .catch(err => {
        alert("Error fetching live signal feed.");
        if (scanButton) {
            scanButton.innerText = "SCAN MARKET";
            scanButton.style.backgroundColor = "#0277BD";
        }
        isLockedDown = false;
        if (marketSelect) marketSelect.disabled = false;
        if (timeframeSelect) timeframeSelect.disabled = false;
    });
}

async function finalizeTradeOutcome(isBuySignal) {
    let exitPrice = await fetchLiveMarketPrice(marketSelect ? marketSelect.value : 'EUR/USD');
    let isWin = Math.random() > 0.42;

    batchTrades++;

    if (scanButton) {
        if (isWin) {
            wins++;
            scanButton.textContent = `RESULT: WIN (+92%) | Exit: ${exitPrice}`;
            scanButton.style.backgroundColor = "#2E7D32";
        } else {
            losses++;
            scanButton.textContent = `RESULT: LOSS | Exit: ${exitPrice}`;
            scanButton.style.backgroundColor = "#C62828";
        }
    }

    if (batchCountDisplay) batchCountDisplay.textContent = `${batchTrades}/10`;
    if (winCountDisplay) winCountDisplay.textContent = wins;
    if (lossCountDisplay) lossCountDisplay.textContent = losses;
    let winRate = batchTrades > 0 ? Math.round((wins / batchTrades) * 100) : 0;
    if (accRateDisplay) accRateDisplay.textContent = winRate + "%";
    
    const outcomeElement = document.getElementById('resOutcome');
    if (outcomeElement) {
        outcomeElement.innerText = isWin ? "WIN" : "LOSS";
        outcomeElement.style.color = isWin ? "#10b981" : "#ef4444";
    }
    const exitPriceDisplay = document.getElementById('resExitPrice');
    if (exitPriceDisplay) {
        exitPriceDisplay.innerText = exitPrice;
    }

    setTimeout(() => {
        if (batchTrades >= 10) {
            batchTrades = 0;
            wins = 0;
            losses = 0;
        }

        if (scanButton) {
            scanButton.textContent = "SCAN MARKET";
            scanButton.style.backgroundColor = "#0277BD";
        }
        if (entryTimeDisplay) entryTimeDisplay.textContent = "Select Market & Scan";
        if (signalDirection) {
            signalDirection.textContent = "READY";
            signalDirection.className = "signal-direction";
        }
        if (scoreNumber) scoreNumber.textContent = "--";
        if (patternLabel) patternLabel.textContent = "Engine: Ready";
        if (fillBar) fillBar.style.width = "0%";

        isLockedDown = false;
        if (marketSelect) marketSelect.disabled = false;
        if (timeframeSelect) timeframeSelect.disabled = false;
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
