# FUTURA ⚽
### The Next Level Football Marketplace

> Marketplace premium dédié à l'univers du football — maillots, ballons, cartes de légendes, accessoires lifestyle.

---

## Structure du projet

```
futura/
├── app.py                  ← Application Flask (routes + API REST)
├── database.py             ← Base SQLite (init, création tables, seed data)
├── requirements.txt        ← Dépendances Python
├── README.md               ← Ce fichier
│
├── instance/
│   └── futura.db           ← Base SQLite (générée automatiquement)
│
├── templates/
│   └── index.html          ← Template HTML principal (Jinja2)
│
└── static/
    ├── css/
    │   └── main.css        ← Tous les styles (variables, composants, animations)
    └── js/
        ├── ui.js           ← Cursor, Toast, Scroll Reveal, Intro cinématique
        ├── cart.js         ← Module panier (sessions Flask via API)
        ├── products.js     ← Chargement produits (Jerseys, Balls, Cards, Accs)
        ├── atelier.js      ← Personnalisation maillot (couleur, nom, numéro)
        └── main.js         ← Init global + formulaire demande personnalisée
```

---

## Installation & Lancement

### 1. Cloner / extraire le projet
```bash
unzip futura_flask.zip
cd futura
```

### 2. Créer un environnement virtuel (recommandé)
```bash
python -m venv venv
source venv/bin/activate       # Linux / macOS
venv\Scripts\activate          # Windows
```

### 3. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 4. Lancer l'application
```bash
python app.py
```

L'application sera disponible sur **http://localhost:5000**

> La base de données SQLite (`instance/futura.db`) est créée et peuplée automatiquement au premier démarrage.

---

## API REST

Toutes les routes API retournent du JSON.

### Produits

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/jerseys` | Liste des maillots |
| `GET` | `/api/jerseys?season=current` | Filtrer par saison (`current`, `iconic`, `archive`) |
| `GET` | `/api/jerseys?continent=europe` | Filtrer par continent |
| `GET` | `/api/jerseys?league=laliga` | Filtrer par ligue |
| `GET` | `/api/balls` | Liste des ballons |
| `GET` | `/api/mini-balls` | Liste des ballons enfants |
| `GET` | `/api/cards?type=current` | Cartes joueurs (`current` ou `iconic`) |
| `GET` | `/api/accessories` | Tous les accessoires |
| `GET` | `/api/accessories?cat=bijoux` | Filtrer par catégorie |

### Panier (session Flask)

| Méthode | Route | Body | Description |
|---------|-------|------|-------------|
| `GET` | `/api/cart` | — | Contenu du panier |
| `POST` | `/api/cart/add` | `{name, price, icon}` | Ajouter un article |
| `POST` | `/api/cart/remove` | `{index}` | Supprimer un article |
| `POST` | `/api/cart/clear` | — | Vider le panier |

### Autres

| Méthode | Route | Body | Description |
|---------|-------|------|-------------|
| `POST` | `/api/promo/apply` | `{code}` | Valider un code promo |
| `POST` | `/api/custom-request` | `{name, contact, message}` | Demande personnalisée |
| `POST` | `/api/checkout` | — | Valider la commande |

---

## Base de données SQLite

### Tables

| Table | Description |
|-------|-------------|
| `jerseys` | Maillots (club, prix, saison, ligue, continent) |
| `balls` | Ballons officiels |
| `mini_balls` | Ballons enfants Mini-Stars |
| `player_cards` | Cartes joueurs & légendes |
| `accessories` | Accessoires lifestyle |
| `promo_codes` | Codes promotionnels et remises |
| `custom_requests` | Demandes personnalisées clients |
| `orders` | Commandes passées |

### Codes promo disponibles par défaut

| Code | Remise |
|------|--------|
| `UCL30` | -30% |
| `PREMIER15` | -15% |
| `MAROC25` | -25% |

---

## Sections du marketplace

| Zone | Contenu |
|------|---------|
| **Zone 01 — Le Vestiaire** | Maillots filtrables par saison, continent, ligue + Atelier personnalisation |
| **Zone 02 — La Sphère** | Ballons officiels + section Mini-Stars (enfants) |
| **Zone 03 — Les Légendes** | Cartes joueurs actuels & iconiques + Pack Opening |
| **Zone 04 — Lifestyle** | Accessoires filtrables par catégorie + formulaire demande sur mesure |

---

## Technologies utilisées

| Couche | Technologie |
|--------|-------------|
| Backend | Python 3 + Flask |
| Base de données | SQLite3 (via module `sqlite3` natif) |
| Frontend | HTML5 + CSS3 + JavaScript vanilla |
| Templates | Jinja2 |
| Fonts | Bebas Neue, Barlow, Noto Kufi Arabic (Google Fonts) |

---

## Personnalisation

### Ajouter un produit
Modifier la fonction `_seed_data()` dans `database.py`, ou insérer directement dans la base :
```sql
INSERT INTO jerseys (club, emoji, price, season, league, continent)
VALUES ('Atletico Madrid', '🔴', 319, 'current', 'laliga', 'europe');
```

### Ajouter un code promo
```sql
INSERT INTO promo_codes (code, discount) VALUES ('SUMMER20', 20);
```

### Changer la clé secrète Flask
Dans `app.py`, ligne 7 :
```python
app.secret_key = 'ta-nouvelle-cle-secrete'
```

---

*Made for the game. Designed for legends.*
