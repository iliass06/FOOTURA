from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import init_db, get_db
import json
import os

app = Flask(__name__)
app.secret_key = 'futura-cinematic-secret-2026'

# ── Init DB on startup ──
with app.app_context():
    init_db()

# ══════════════════════════════
#  PAGES
# ══════════════════════════════

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_page():
    if session.get('role') != 'admin':
        return redirect(url_for('index'))
    return render_template('admin.html')

# ══════════════════════════════
#  API — AUTH
# ══════════════════════════════

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    # password = data.get('password') # In real app, check hash
    
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user: # Simplified check for this demo
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'success': True, 'role': user['role']})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'})

@app.route('/api/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# ══════════════════════════════
#  API — PRODUCTS & FILTERING
# ══════════════════════════════

@app.route('/api/products')
def get_products():
    cat = request.args.get('category')
    league = request.args.get('league')
    continent = request.args.get('continent')
    club = request.args.get('club')
    nation = request.args.get('nation')
    rarity = request.args.get('rarity')
    
    db = get_db()
    query = '''
        SELECT p.*, c.slug as category_slug, l.name as league_name, cl.name as club_name, n.name as nation_name 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN leagues l ON p.league_id = l.id
        LEFT JOIN clubs cl ON p.club_id = cl.id
        LEFT JOIN nations n ON p.nation_id = n.id
        WHERE 1=1
    '''
    params = []
    
    if cat:
        query += ' AND c.slug = ?'
        params.append(cat)
    if league:
        query += ' AND l.slug = ?'
        params.append(league)
    if continent:
        query += ' AND p.continent = ?'
        params.append(continent)
    if club:
        query += ' AND cl.slug = ?'
        params.append(club)
    if nation:
        query += ' AND n.slug = ?'
        params.append(nation)
    if rarity:
        query += ' AND p.rarity = ?'
        params.append(rarity)
        
    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/product/<int:product_id>')
def get_product(product_id):
    db = get_db()
    row = db.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if row:
        return jsonify(dict(row))
    return jsonify({'error': 'Product not found'}), 404

# ══════════════════════════════
#  API — CART & CHECKOUT
# ══════════════════════════════

@app.route('/api/cart', methods=['GET'])
def get_cart():
    return jsonify(session.get('cart', []))

@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    cart = session.get('cart', [])
    cart.append(data)
    session['cart'] = cart
    session.modified = True
    return jsonify({'success': True, 'count': len(cart)})

@app.route('/api/cart/remove', methods=['POST'])
def remove_from_cart():
    idx = request.get_json().get('index')
    cart = session.get('cart', [])
    if 0 <= idx < len(cart):
        cart.pop(idx)
    session['cart'] = cart
    session.modified = True
    return jsonify({'success': True, 'count': len(cart)})

@app.route('/api/checkout', methods=['POST'])
def checkout():
    cart = session.get('cart', [])
    if not cart:
        return jsonify({'success': False, 'message': 'Cart is empty'})
    
    total = sum(float(item.get('price', 0)) for item in cart)
    user_id = session.get('user_id')
    
    db = get_db()
    db.execute('INSERT INTO orders (user_id, items_json, total) VALUES (?, ?, ?)',
               (user_id, json.dumps(cart), total))
    db.commit()
    
    session['cart'] = []
    session.modified = True
    return jsonify({'success': True, 'message': 'Order confirmed! Goal! ⚽'})

# ══════════════════════════════
#  API — CUSTOM REQUESTS
# ══════════════════════════════

@app.route('/api/custom-request', methods=['POST'])
def submit_custom_request():
    data = request.get_json()
    db = get_db()
    db.execute('INSERT INTO custom_requests (name, contact, message, image_ref) VALUES (?, ?, ?, ?)',
               (data.get('name'), data.get('contact'), data.get('message'), data.get('image_ref')))
    db.commit()
    return jsonify({'success': True})

# ══════════════════════════════
#  API — ADMIN PANEL
# ══════════════════════════════

@app.route('/api/admin/orders')
def admin_orders():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    db = get_db()
    rows = db.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/products', methods=['POST'])
def admin_add_product():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    db = get_db()
    db.execute('''
        INSERT INTO products (category_id, name, price, description, emoji, badge, season, continent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data.get('category_id'), data.get('name'), data.get('price'), data.get('description'),
          data.get('emoji'), data.get('badge'), data.get('season'), data.get('continent')))
    db.commit()
    return jsonify({'success': True})

# ══════════════════════════════
#  API — UTILS
# ══════════════════════════════

@app.route('/api/coupons/validate', methods=['POST'])
def validate_coupon():
    code = request.get_json().get('code', '').upper()
    db = get_db()
    row = db.execute('SELECT * FROM coupons WHERE code = ? AND active = 1', (code,)).fetchone()
    if row:
        return jsonify({'success': True, 'discount': row['discount_percent']})
    return jsonify({'success': False, 'message': 'Invalid coupon'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
