from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import init_db, get_db, close_db
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'futura-cinematic-secret-2026'

UPLOAD_FOLDER = 'static/img/products'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ── Init DB on startup ──
with app.app_context():
    init_db()

@app.teardown_appcontext
def teardown_db(exception):
    close_db()

# ══════════════════════════════
#  DECORATORS
# ══════════════════════════════

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

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

@app.route('/checkout')
def checkout_page():
    return render_template('checkout.html')

@app.route('/category/<slug>')
def category_page(slug):
    return render_template('category.html', category=slug)

@app.route('/profile')
@login_required
def profile_page():
    return render_template('profile.html')

# ══════════════════════════════
#  API — AUTH
# ══════════════════════════════

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    username = data.get('username')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    
    if not first_name or not last_name or not username or not email or not phone or not password:
        return jsonify({'success': False, 'message': 'Missing fields'})
    
    db = get_db()
    try:
        hashed_pw = generate_password_hash(password)
        db.execute('INSERT INTO users (first_name, last_name, username, email, phone, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
                   (first_name, last_name, username, email, phone, hashed_pw))
        db.commit()
        return jsonify({'success': True, 'message': 'Registration successful'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Username or Email already exists'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        
        # Merge session cart (guest items) with persistent DB cart
        guest_cart = session.get('cart', [])
        db_cart = []
        try:
            if user['cart_json']:
                db_cart = json.loads(user['cart_json'])
        except:
            db_cart = []
        
        # Combine items, guest items are added to the existing DB cart
        merged_cart = db_cart + guest_cart
        session['cart'] = merged_cart
        
        # Persist merged cart to DB
        db.execute('UPDATE users SET cart_json = ? WHERE id = ?',
                   (json.dumps(merged_cart), user['id']))
        db.commit()

        return jsonify({
            'success': True, 
            'username': user['username'],
            'role': user['role']
        })
    
    return jsonify({'success': False, 'message': 'Invalid credentials'})

@app.route('/api/logout')
def logout():
    # Save cart before clearing session if user is logged in
    if 'user_id' in session and 'cart' in session:
        db = get_db()
        db.execute('UPDATE users SET cart_json = ? WHERE id = ?',
                   (json.dumps(session['cart']), session['user_id']))
        db.commit()

    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/auth/status')
def auth_status():
    if 'user_id' in session:
        db = get_db()
        user = db.execute('SELECT email, phone, username, role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        if user:
            return jsonify({
                'logged_in': True,
                'username': user['username'],
                'role': user['role'],
                'email': user['email'],
                'phone': user['phone']
            })
    return jsonify({'logged_in': False})

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
    brand = request.args.get('brand')
    card_type = request.args.get('card_type')
    limit = request.args.get('limit', type=int)
    
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
        query += ' AND (p.league = ? OR l.slug = ?)'
        params.extend([league, league])
    if continent:
        query += ' AND (LOWER(p.continent) = LOWER(?) OR LOWER(n.continent) = LOWER(?))'
        params.extend([continent, continent])
    if brand:
        query += ' AND LOWER(p.brand) = LOWER(?)'
        params.append(brand)
    if card_type:
        query += ' AND (LOWER(p.card_type) = LOWER(?) OR LOWER(p.rarity) = LOWER(?))'
        params.extend([card_type, card_type])
    if rarity:
        query += ' AND LOWER(p.rarity) = LOWER(?)'
        params.append(rarity)
    if club:
        query += ' AND cl.slug = ?'
        params.append(club)
    if nation:
        query += ' AND n.slug = ?'
        params.append(nation)

    if limit:
        query += ' LIMIT ?'
        params.append(limit)
        
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
    if session.get('role') == 'admin':
        return jsonify({'success': False, 'message': 'Admins cannot acquire equipment'}), 403
    data = request.get_json()
    cart = session.get('cart', [])
    cart.append(data)
    session['cart'] = cart
    session.modified = True

    # Persist to DB if logged in
    if 'user_id' in session:
        db = get_db()
        db.execute('UPDATE users SET cart_json = ? WHERE id = ?',
                   (json.dumps(cart), session['user_id']))
        db.commit()

    return jsonify({'success': True, 'count': len(cart)})

@app.route('/api/cart/remove', methods=['POST'])
def remove_from_cart():
    idx = request.get_json().get('index')
    cart = session.get('cart', [])
    if 0 <= idx < len(cart):
        cart.pop(idx)
    session['cart'] = cart
    session.modified = True

    # Persist to DB if logged in
    if 'user_id' in session:
        db = get_db()
        db.execute('UPDATE users SET cart_json = ? WHERE id = ?',
                   (json.dumps(cart), session['user_id']))
        db.commit()

    return jsonify({'success': True, 'count': len(cart)})

@app.route('/api/checkout', methods=['POST'])
@login_required
def checkout():
    cart = session.get('cart', [])
    if not cart:
        return jsonify({'success': False, 'message': 'Cart is empty'})
    
    data = request.get_json()
    total = sum(float(item.get('price', 0)) for item in cart)
    
    # Handle discount if coupon was applied
    coupon_code = data.get('coupon_code')
    discount_amount = data.get('discount_amount', 0)
    final_total = total - discount_amount
    
    user_id = session.get('user_id')
    
    db = get_db()
    db.execute('INSERT INTO orders (user_id, items_json, total, coupon_code, discount_amount) VALUES (?, ?, ?, ?, ?)',
               (user_id, json.dumps(cart), final_total, coupon_code, discount_amount))
    
    # Clear cart in DB as well
    db.execute('UPDATE users SET cart_json = ? WHERE id = ?', ('[]', user_id))
    db.commit()
    
    session['cart'] = []
    session.modified = True
    return jsonify({'success': True, 'message': 'Order confirmed! Goal!'})

# ══════════════════════════════
#  API — ADMIN PRODUCT MANAGEMENT
# ══════════════════════════════

@app.route('/api/admin/products', methods=['POST'])
@admin_required
def admin_add_product():
    data = request.get_json()
    db = get_db()
    
    # Support both category_id and category_slug for flexibility
    category_id = data.get('category_id')
    if not category_id and data.get('category_slug'):
        cat = db.execute('SELECT id FROM categories WHERE slug = ?', (data.get('category_slug'),)).fetchone()
        if cat:
            category_id = cat['id']
            
    if not category_id:
        return jsonify({'success': False, 'message': 'Invalid category'}), 400
    
    try:
        db.execute('''
            INSERT INTO products (category_id, name, price, image_url, description, badge, season, continent, league, brand, card_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (category_id, data.get('name'), data.get('price'), 
              data.get('image_url'), data.get('description', 'Added via admin'),
              data.get('badge', 'new'), data.get('season', '2024-25'), 
              data.get('continent', 'europe'), data.get('league'), 
              data.get('brand'), data.get('card_type')))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/product/<int:product_id>', methods=['PUT'])
@admin_required
def admin_update_product(product_id):
    data = request.get_json()
    db = get_db()

    # Fetch current values to preserve fields not sent by the small edit modal
    current = db.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    # Merge data (prefer new, fallback to current)
    name = data.get('name', current['name'])
    price = data.get('price', current['price'])
    image_url = data.get('image_url', current['image_url'])
    description = data.get('description', current['description'])
    badge = data.get('badge', current['badge'])
    season = data.get('season', current['season'])
    continent = data.get('continent', current['continent'])
    league = data.get('league', current['league'])
    brand = data.get('brand', current['brand'])
    card_type = data.get('card_type', current['card_type'])

    try:
        db.execute('''
            UPDATE products
            SET name = ?, price = ?, image_url = ?, description = ?, 
                badge = ?, season = ?, continent = ?, league = ?, brand = ?, card_type = ?
            WHERE id = ?
        ''', (name, price, image_url, description, badge, 
              season, continent, league, brand, card_type, product_id))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
@app.route('/api/admin/product/<int:product_id>', methods=['DELETE'])
@admin_required
def admin_delete_product(product_id):
    db = get_db()
    db.execute('DELETE FROM products WHERE id = ?', (product_id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/upload', methods=['POST'])
@admin_required
def admin_upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Ensure directory exists
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({'success': True, 'url': '/' + file_path})
    return jsonify({'success': False, 'message': 'File type not allowed'}), 400

# ══════════════════════════════
#  API — ADMIN MANAGEMENT (USERS, ORDERS, COUPONS, etc.)
# ══════════════════════════════

@app.route('/api/admin/orders')
@admin_required
def admin_orders():
    db = get_db()
    rows = db.execute('''
        SELECT o.*, u.username, u.email 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC
    ''').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/order/<int:order_id>', methods=['PUT'])
@admin_required
def admin_update_order(order_id):
    data = request.get_json()
    status = data.get('status')
    db = get_db()
    db.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/users')
@admin_required
def admin_get_users():
    db = get_db()
    rows = db.execute('SELECT id, first_name, last_name, username, email, phone, role, created_at FROM users ORDER BY created_at DESC').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/user/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    if user_id == session.get('user_id'):
        return jsonify({'success': False, 'message': 'Cannot delete yourself'}), 400
    db = get_db()
    db.execute('DELETE FROM users WHERE id = ?', (user_id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/custom-requests')
@admin_required
def admin_get_custom_requests():
    db = get_db()
    rows = db.execute('SELECT * FROM custom_requests ORDER BY created_at DESC').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/custom-request', methods=['POST'])
def submit_custom_request():
    data = request.get_json()
    name = data.get('name')
    contact = data.get('contact')
    message = data.get('message')
    user_id = session.get('user_id') # Get user_id if logged in
    
    if not name or not contact or not message:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
        
    db = get_db()
    db.execute('INSERT INTO custom_requests (name, contact, message, user_id) VALUES (?, ?, ?, ?)',
               (name, contact, message, user_id))
    db.commit()
    return jsonify({'success': True, 'message': 'Request submitted'})

@app.route('/api/user/data')
@login_required
def get_user_data():
    user_id = session.get('user_id')
    db = get_db()
    
    orders = db.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
    reviews = db.execute('SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
    custom_requests = db.execute('SELECT * FROM custom_requests WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
    
    return jsonify({
        'orders': [dict(o) for o in orders],
        'reviews': [dict(r) for r in reviews],
        'custom_requests': [dict(cr) for cr in custom_requests]
    })

@app.route('/api/admin/custom-request/<int:request_id>', methods=['PUT'])
@admin_required
def admin_update_custom_request_status(request_id):
    data = request.get_json()
    status = data.get('status')
    db = get_db()
    db.execute('UPDATE custom_requests SET status = ? WHERE id = ?', (status, request_id))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/custom-request/<int:request_id>', methods=['DELETE'])
@admin_required
def admin_delete_custom_request(request_id):
    db = get_db()
    db.execute('DELETE FROM custom_requests WHERE id = ?', (request_id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/coupons')
@admin_required
def admin_get_coupons():
    db = get_db()
    rows = db.execute('SELECT * FROM coupons').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/coupon', methods=['POST'])
@admin_required
def admin_add_coupon():
    data = request.get_json()
    db = get_db()
    try:
        db.execute('INSERT INTO coupons (code, discount_percent) VALUES (?, ?)',
                   (data.get('code').upper(), data.get('discount_percent')))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/admin/coupon/<int:coupon_id>', methods=['DELETE'])
@admin_required
def admin_delete_coupon(coupon_id):
    db = get_db()
    db.execute('DELETE FROM coupons WHERE id = ?', (coupon_id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/admin/review/<int:review_id>', methods=['DELETE'])
@admin_required
def admin_delete_review(review_id):
    db = get_db()
    db.execute('DELETE FROM reviews WHERE id = ?', (review_id,))
    db.commit()
    return jsonify({'success': True})


# ══════════════════════════════
#  API — COMMUNITY & REVIEWS
# ══════════════════════════════

@app.route('/api/reviews', methods=['GET'])
def get_all_reviews():
    db = get_db()
    # Explicitly select from users table to avoid name collisions with reviews.username
    rows = db.execute('''
        SELECT 
            r.id, r.rating, r.comment, r.created_at,
            u.username as u_username, 
            u.first_name as u_first_name, 
            u.last_name as u_last_name 
        FROM reviews r 
        LEFT JOIN users u ON r.user_id = u.id 
        ORDER BY r.created_at DESC
    ''').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/reviews/submit', methods=['POST'])
@login_required
def submit_review():
    data = request.get_json()
    user_id = session.get('user_id')
    rating = data.get('rating')
    comment = data.get('comment')
    
    if not rating or not comment:
        return jsonify({'success': False, 'message': 'Rating and comment are required'}), 400
        
    db = get_db()
    db.execute('INSERT INTO reviews (user_id, rating, comment) VALUES (?, ?, ?)',
               (user_id, rating, comment))
    db.commit()
    return jsonify({'success': True, 'message': 'Review deployed to the field!'})

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
