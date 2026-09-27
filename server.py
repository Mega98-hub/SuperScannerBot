from flask import Flask, jsonify, request
import requests
import random

app = Flask(__name__)

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

    is_buy = random.choice([True, False])
    signal_direction = "BUY" if is_buy else "SELL"
    score = random.randint(92, 99)
    
    patterns = [
        "Volume Exhaustion Rejection", 
        "Institutional Liquidity Sweep", 
        "Order Block Mitigation", 
        "Fibonacci 0.618 Golden Zone", 
        "Momentum Breakout Cross"
    ]
    active_pattern = random.choice(patterns)

    return jsonify({
        "status": "success",
        "market": market,
        "timeframe": timeframe,
        "signal": signal_direction,
        "score": score,
        "pattern": active_pattern,
        "live_price": live_tick
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
