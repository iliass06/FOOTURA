import sqlite3
import os
import json
from flask import g

DATABASE = 'instance/futura.db'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            DATABASE,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    if not os.path.exists('instance'):
        os.makedirs('instance')
    
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    _create_tables(db)
    _seed_data(db)
    db.close()

def _create_tables(db):
    db.executescript('''
        -- 1. REFERENCE TABLES
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS leagues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            continent TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS clubs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            league_id INTEGER,
            FOREIGN KEY (league_id) REFERENCES leagues(id)
        );

        CREATE TABLE IF NOT EXISTS nations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            continent TEXT NOT NULL
        );

        -- 2. PRODUCTS
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            old_price REAL,
            image_url TEXT,
            emoji TEXT,
            badge TEXT,
            badge_text TEXT,
            
            -- Dynamic attributes
            brand TEXT,
            season TEXT,
            rarity TEXT, -- for cards: Common, Rare, Epic, Legendary, Iconic
            is_iconic INTEGER DEFAULT 0,
            
            -- Filtering links
            league_id INTEGER,
            club_id INTEGER,
            nation_id INTEGER,
            continent TEXT,
            
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (league_id) REFERENCES leagues(id),
            FOREIGN KEY (club_id) REFERENCES clubs(id),
            FOREIGN KEY (nation_id) REFERENCES nations(id)
        );

        -- 3. USERS & AUTH
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user', -- 'user' | 'admin'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. ECOMMERCE
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            items_json TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending', -- pending, completed, cancelled
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            discount_percent INTEGER NOT NULL,
            active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS custom_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            contact TEXT,
            message TEXT,
            image_ref TEXT,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. COMMUNITY
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER,
            username TEXT,
            rating INTEGER,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    ''')
    db.commit()

def _seed_data(db):
    # Skip seeding if data already exists
    if db.execute('SELECT COUNT(*) FROM categories').fetchone()[0] > 0:
        return

    # Categories
    cats = [('jerseys', 'Jerseys'), ('balls', 'Balls'), ('cards', 'Cards'), ('accessories', 'Accessories')]
    db.executemany('INSERT INTO categories (slug, name) VALUES (?,?)', cats)
    cat_ids = {row['slug']: row['id'] for row in db.execute('SELECT * FROM categories').fetchall()}

    # Leagues
    leagues = [
        ('botola', 'Botola Pro Inwi', 'africa'),
        ('pl', 'Premier League', 'europe'),
        ('laliga', 'LaLiga', 'europe'),
        ('ligue1', 'Ligue 1', 'europe'),
        ('seriea', 'Serie A', 'europe'),
        ('bundesliga', 'Bundesliga', 'europe'),
        ('saudi', 'Saudi Pro League', 'asia'),
        ('eredivisie', 'Eredivisie', 'europe'),
        ('nations', 'International', 'various')
    ]
    db.executemany('INSERT INTO leagues (slug, name, continent) VALUES (?,?,?)', leagues)
    league_ids = {row['slug']: row['id'] for row in db.execute('SELECT * FROM leagues').fetchall()}

    # Clubs
    clubs = [
        ('wac', 'Wydad AC', league_ids['botola']),
        ('rca', 'Raja CA', league_ids['botola']),
        ('rm', 'Real Madrid', league_ids['laliga']),
        ('fcb', 'FC Barcelona', league_ids['laliga']),
        ('mcity', 'Manchester City', league_ids['pl']),
        ('psg', 'PSG', league_ids['ligue1']),
        ('bayern', 'Bayern München', league_ids['bundesliga']),
        ('alnassr', 'Al-Nassr', league_ids['saudi']),
        ('ajax', 'Ajax Amsterdam', league_ids['eredivisie']),
        ('juventus', 'Juventus', league_ids['seriea'])
    ]
    db.executemany('INSERT INTO clubs (slug, name, league_id) VALUES (?,?,?)', clubs)
    club_ids = {row['slug']: row['id'] for row in db.execute('SELECT * FROM clubs').fetchall()}

    # Nations
    nations = [
        ('maroc', 'Morocco', 'africa'),
        ('france', 'France', 'europe'),
        ('brazil', 'Brazil', 'south-am'),
        ('portugal', 'Portugal', 'europe'),
        ('argentina', 'Argentina', 'south-am')
    ]
    db.executemany('INSERT INTO nations (slug, name, continent) VALUES (?,?,?)', nations)
    nation_ids = {row['slug']: row['id'] for row in db.execute('SELECT * FROM nations').fetchall()}

    # Products - Jerseys
    jerseys = [
        (cat_ids['jerseys'], 'Real Madrid Home 24/25', 'The legendary white.', 349.0, 399.0, '/static/img/products/rm-home.jpg', '⚪', 'new', '2024-25', league_ids['laliga'], club_ids['rm'], None, 'europe'),
        (cat_ids['jerseys'], 'Wydad AC Home', 'Red pride of Casablanca.', 189.0, None, '/static/img/products/wac-home.jpg', '🔴', 'local', '2024-25', league_ids['botola'], club_ids['wac'], None, 'africa'),
        (cat_ids['jerseys'], 'Brazil 1970 Retro', 'Pele''s masterpiece.', 449.0, None, '/static/img/products/brazil-retro.jpg', '🟡', 'iconic', 'retro', league_ids['nations'], None, nation_ids['brazil'], 'south-am'),
        (cat_ids['jerseys'], 'Morocco WC 2022', 'The Atlas Lions miracle.', 299.0, None, '/static/img/products/maroc-wc.jpg', '⭐', 'iconic', '2022', league_ids['nations'], None, nation_ids['maroc'], 'africa'),
        (cat_ids['jerseys'], 'Manchester City Home', 'Blue Moon rising.', 329.0, None, '/static/img/products/mcity-home.jpg', '👕', 'champion', '2024-25', league_ids['pl'], club_ids['mcity'], None, 'europe'),
        (cat_ids['jerseys'], 'Raja CA Away', 'The Green Eagles.', 179.0, None, '/static/img/products/rca-away.jpg', '🟢', 'local', '2024-25', league_ids['botola'], club_ids['rca'], None, 'africa'),
        (cat_ids['jerseys'], 'PSG Fourth Kit', 'Parisian style.', 389.0, None, '/static/img/products/psg-fourth.jpg', '🗼', 'fashion', '2024-25', league_ids['ligue1'], club_ids['psg'], None, 'europe'),
        (cat_ids['jerseys'], 'Argentina Retro 1986', 'Maradona''s glory.', 499.0, None, '/static/img/products/argentina-retro.jpg', '🔟', 'legend', 'retro', league_ids['nations'], None, nation_ids['argentina'], 'south-am')
    ]
    db.executemany('''
        INSERT INTO products (category_id, name, description, price, old_price, image_url, emoji, badge, season, league_id, club_id, nation_id, continent) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''', jerseys)

    # Products - Balls
    balls = [
        (cat_ids['balls'], 'UCL Pro Ball 2024', 'Official match ball.', 599.0, None, '/static/img/products/ucl-ball.jpg', '⚽', 'official', 'Adidas'),
        (cat_ids['balls'], 'Al Rihla WC 2022', 'The Journey.', 699.0, None, '/static/img/products/rihla-ball.jpg', '⚽', 'iconic', 'Adidas'),
        (cat_ids['balls'], 'Nike Strike PL', 'Premier League official.', 449.0, None, '/static/img/products/pl-ball.jpg', '⚽', 'official', 'Nike'),
        (cat_ids['balls'], 'Mini-Star Kids Ball', 'Safe foam ball.', 99.0, None, '/static/img/products/mini-ball.jpg', '⚽', 'kids', 'Kipsta'),
        (cat_ids['balls'], 'Street Pro Concrete', 'Built for the streets.', 249.0, None, '/static/img/products/street-ball.jpg', '🏀', 'street', 'Molten'),
        (cat_ids['balls'], 'Gold Edition Ball', 'Display masterpiece.', 1299.0, None, '/static/img/products/gold-ball.jpg', '✨', 'collector', 'Futura')
    ]
    db.executemany('''
        INSERT INTO products (category_id, name, description, price, old_price, image_url, emoji, badge, brand) 
        VALUES (?,?,?,?,?,?,?,?,?)''', balls)

    # Products - Cards
    cards = [
        (cat_ids['cards'], 'Zinedine Zidane', 'The Maestro.', 299.0, None, '/static/img/products/card-zidane.jpg', '🏆', 'iconic', 'Iconic', 1, 'europe'),
        (cat_ids['cards'], 'Kylian Mbappé', 'Speed of light.', 149.0, None, '/static/img/products/card-mbappe.jpg', '🚀', 'legendary', 'Legendary', 0, 'europe'),
        (cat_ids['cards'], 'Hakim Ziyech', 'The Wizard.', 129.0, None, '/static/img/products/card-ziyech.jpg', '🪄', 'epic', 'Epic', 0, 'africa'),
        (cat_ids['cards'], 'Erling Haaland', 'The Terminator.', 159.0, None, '/static/img/products/card-haaland.jpg', '🤖', 'rare', 'Rare', 0, 'europe'),
        (cat_ids['cards'], 'Lionel Messi', 'The GOAT.', 399.0, None, '/static/img/products/card-messi.jpg', '🐐', 'mythic', 'Iconic', 1, 'south-am'),
        (cat_ids['cards'], 'Cristiano Ronaldo', 'Siuuu.', 399.0, None, '/static/img/products/card-ronaldo.jpg', '🇵🇹', 'mythic', 'Iconic', 1, 'europe')
    ]
    db.executemany('''
        INSERT INTO products (category_id, name, description, price, old_price, image_url, emoji, badge, rarity, is_iconic, continent) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?)''', cards)

    # Products - Accessories
    accs = [
        (cat_ids['accessories'], 'Luxury Watch Football Ed.', 'Premium timepiece.', 1499.0, None, '/static/img/products/acc-watch.jpg', '⌚', 'luxury'),
        (cat_ids['accessories'], 'Ultra Cap', 'Streetwear vibes.', 149.0, None, '/static/img/products/acc-cap.jpg', '🧢', 'mode'),
        (cat_ids['accessories'], 'Gold Bracelet', 'Football elegance.', 299.0, None, '/static/img/products/acc-bracelet.jpg', '📿', 'jewelry'),
        (cat_ids['accessories'], 'Futura Scarf', 'Show your colors.', 89.0, None, '/static/img/products/acc-scarf.jpg', '🧣', 'fan'),
        (cat_ids['accessories'], 'Leather Wallet', 'Sleek design.', 199.0, None, '/static/img/products/acc-wallet.jpg', '💼', 'premium'),
        (cat_ids['accessories'], 'Elite Gym Bag', 'Gear for pros.', 349.0, None, '/static/img/products/acc-bag.jpg', '🎒', 'training')
    ]
    db.executemany('''
        INSERT INTO products (category_id, name, description, price, old_price, image_url, emoji, badge) 
        VALUES (?,?,?,?,?,?,?,?)''', accs)

    # Coupons
    db.executemany('INSERT INTO coupons (code, discount_percent) VALUES (?,?)', [('UCL30', 30), ('FOOTURA25', 25)])

    # Admin User (password: admin123 - for demo purposes, hash it properly in real app)
    # Simple hash for now or just plain text for this local dev project as per "easy local development"
    db.execute('INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)', 
               ('admin', 'admin@futura.com', 'pbkdf2:sha256:600000$admin_hash', 'admin'))

    db.commit()
