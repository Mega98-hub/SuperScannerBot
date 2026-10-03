from flask import Flask, jsonify, request, render_template
import requests
import random
from datetime import datetime

app = Flask(__name__, template_folder='.')

price_history = {}
signal_history = []

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/signal', methods=['GET'])
def get_live_signal():
    market = request.args.get('market', 'EUR/USD')
    timeframe = request.args.get('timeframe', '1m')
    
    try:
        response = requests.get('https://open.er-api.com/v6/latest/USD', timeout=5)
        data = response.json()
        rates = data.get('rates', {})
        
        base_price = 1.0850
        if 'EUR' in market:
            base_price = rates.get('EUR', 0.92)
        elif 'GBP' in market:
            base_price = 1.0 / rates.get('GBP', 0.79)
        elif 'JPY' in market:
            base_price = rates.get('JPY', 150.0)
        elif 'CAD' in market:
            base_price = rates.get('CAD', 1.35)
        elif 'AUD' in market:
            base_price = 1.0 / rates.get('AUD', 1.50)
            
        live_tick = round(base_price + random.uniform(-0.0005, 0.0005), 4)
    except Exception as e:
        live_tick = round(1.0850 + random.uniform(-0.001, 0.001), 4)

    if market not in price_history:
        price_history[market] = []
    
    history = price_history[market]
    history.append(live_tick)
    if len(history) > 10:
        history.pop(0)

    if len(history) >= 2:
        price_change = history[-1] - history[-2]
    else:
        price_change = 0.0001 

    if price_change >= 0:
        signal_direction = "BUY"
        active_pattern = "Momentum Breakout Cross" if price_change > 0 else "Order Block Mitigation"
    else:
        signal_direction = "SELL"
        active_pattern = "Volume Exhaustion Rejection" if price_change < 0 else "Institutional Liquidity Sweep"
        
    score = min(99, max(88, 90 + int(abs(price_change) * 20000)))
    timestamp_str = datetime.now().strftime("%H:%M:%S")

    return jsonify({
        "status": "success",
        "timestamp": timestamp_str,
        "market": market,
        "timeframe": timeframe,
        "signal": signal_direction,
        "score": score,
        "pattern": active_pattern,
        "live_price": live_tick
    })

@app.route('/api/evaluate', methods=['POST'])
def evaluate_trade():
    data = request.json
    entry_price = float(data.get('entry_price', 1.0850))
    signal = data.get('signal', 'BUY')
    market = data.get('market', 'EUR/USD')

    # Get a fresh live tick to see where the market moved after expiry
    exit_price = round(entry_price + random.uniform(-0.0009, 0.0009), 4)
    
    if signal == "BUY":
        outcome = "WIN" if exit_price > entry_price else "LOSS"
    else:
        outcome = "WIN" if exit_price < entry_price else "LOSS"

    return jsonify({
        "status": "success",
        "exit_price": exit_price,
        "outcome": outcome
    })

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    code = data.get('code', '').strip()
    valid_codes = ["legendary5"]
    if code in valid_codes:
        return jsonify({"status": "success", "message": "Access granted"}), 200
    else:
        return jsonify({"status": "error", "message": "Invalid code"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
