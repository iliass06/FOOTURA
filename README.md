# FUTURA
### The Next Level Football Marketplace

> Marketplace premium dédié à l'univers du football — maillots, ballons, cartes de légendes, lifestyle.

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
│   ├── index.html          ← Template HTML principal
│   ├── category.html       ← Template pour les catégories
│   ├── admin.html          ← Panneau d'administration
│   └── checkout.html       ← Page de paiement
│
└── static/
    ├── css/
    │   └── main.css        ← Tous les styles
    └── js/
        ├── ui.js           ← Cursor, Toast, Intro cinématique
        ├── cart.js         ← Module panier
        ├── products.js     ← Chargement dynamique des produits
        ├── auth.js         ← Authentification (Login/Register)
        ├── community.js    ← Reviews et feedback
        └── main.js         ← Init global + Lenis + Three.js
```

---

## Installation & Lancement

### 1. Cloner / extraire le projet
```bash
cd futura_flask
```

### 2. Créer un environnement virtuel
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

---

## API REST

### Produits

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/products` | Liste tous les produits |
| `GET` | `/api/products?category=jerseys` | Filtrer par catégorie |
| `GET` | `/api/products?league=laliga` | Filtrer par ligue |
| `GET` | `/api/products?continent=africa` | Filtrer par continent |
| `GET` | `/api/product/<id>` | Détails d'un produit |

### Panier & Commandes

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/cart` | Contenu du panier |
| `POST` | `/api/cart/add` | Ajouter un article |
| `POST` | `/api/cart/remove` | Supprimer un article |
| `POST` | `/api/checkout` | Valider la commande |

---

## Base de données SQLite

### Catégories disponibles
- `jerseys` (Maillots)
- `balls` (Ballons)
- `cards` (Cartes)
- `boots` (Chaussures)
- `lifestyle` (Accessoires & Style)

---

*Made for the game. Designed for legends.*
