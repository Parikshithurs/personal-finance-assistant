# 💰 FinanceAI — ML-Based Personal Finance Assistant

> An AI-powered, full-stack personal finance tracker built with **React**, **Flask**, and **Scikit-learn**. Automatically categorizes expenses using Machine Learning, tracks budgets, and sends smart alerts.

---

## 🧠 Features

| Feature | Details |
|---|---|
| **ML Categorization** | TF-IDF + Multinomial Naive Bayes auto-categorizes expense descriptions |
| **Expense Tracking** | Add expenses with description, amount, category, date |
| **Budget Alerts** | Set per-category monthly budgets; get ⚠️ alerts when exceeded |
| **Analytics** | Interactive Pie, Bar, and Area charts via Recharts |
| **Dark UI** | Premium dark theme with glassmorphism and animations |
| **REST API** | 7 clean endpoints powering all features |

---

## 📂 Project Structure

```
finance-assistant/
├── backend/
│   ├── app.py                 # Flask REST API (7 endpoints)
│   ├── model/
│   │   ├── train_model.py     # ML training script
│   │   └── expense_model.pkl  # Trained model (auto-generated)
│   ├── database.db            # SQLite database (auto-created)
│   ├── requirements.txt       # Python dependencies
│   └── Procfile               # Render/Heroku deployment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx  # Overview with stats
│   │   │   ├── ExpenseForm.jsx # Add expense with AI prediction
│   │   │   ├── ExpenseList.jsx # Sortable expense table
│   │   │   ├── Charts.jsx     # Pie + Bar + Area charts
│   │   │   ├── Alerts.jsx     # Budget alert notifications
│   │   │   └── BudgetForm.jsx # Set budget per category
│   │   ├── App.js             # Root component + navigation
│   │   ├── api.js             # Axios API module
│   │   └── index.css          # Complete design system
│   ├── .env                   # API URL config
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup & Run Locally

### Prerequisites
- Python 3.9+
- Node.js 16+
- pip

### 1️⃣ Backend Setup

```bash
cd backend

# Install dependencies
pip install flask flask-cors scikit-learn pandas numpy

# Train the ML model (generates expense_model.pkl)
python model/train_model.py

# Start Flask API
python app.py
# API runs at: http://localhost:5000
```

### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
# App runs at: http://localhost:3000
```

### 3️⃣ Open the App
Navigate to **http://localhost:3000** in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/predict` | Predict expense category (ML) |
| `POST` | `/expense` | Add a new expense |
| `GET` | `/expenses` | Get all expenses |
| `GET` | `/summary` | Monthly spending summary |
| `POST` | `/budget` | Set category budget |
| `GET` | `/budgets` | Get all budgets |
| `GET` | `/alerts` | Get budget alerts |

### Example Requests

**Predict Category:**
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"description": "Uber ride to airport"}'

# Response:
# {"category": "Transport", "confidence": {...}, "top_confidence": 0.92}
```

**Add Expense:**
```bash
curl -X POST http://localhost:5000/expense \
  -H "Content-Type: application/json" \
  -d '{"description": "Lunch at restaurant", "amount": 350, "date": "2026-02-27"}'
```

**Set Budget:**
```bash
curl -X POST http://localhost:5000/budget \
  -H "Content-Type: application/json" \
  -d '{"category": "Food", "budget": 5000}'
```

---

## 🤖 ML Model Details

| Property | Value |
|----------|-------|
| **Algorithm** | Multinomial Naive Bayes |
| **Vectorizer** | TF-IDF (unigrams + bigrams) |
| **Categories** | Food, Transport, Shopping, Bills, Entertainment, Other |
| **Training Samples** | 130+ labeled descriptions |
| **Library** | Scikit-learn |
| **Storage** | `expense_model.pkl` (pickle) |

**How it works:**
1. User types expense description (e.g., "Netflix subscription")
2. Frontend debounces and calls `POST /predict`
3. Flask loads the trained TF-IDF + Naive Bayes pipeline
4. Model returns predicted category + confidence scores
5. Category auto-fills the form field (user can override)

---

## 🚀 Deployment

### Backend → Render

1. Push `backend/` to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command**: `pip install -r requirements.txt && python model/train_model.py`
4. Set **Start Command**: `gunicorn app:app`
5. Add environment variable: `PORT=10000`

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variable: `REACT_APP_API_URL=https://your-render-api.onrender.com`
4. Deploy!

---

## 🎨 Tech Stack

### Frontend
- **React.js** (Create React App)
- **Recharts** — Pie, Bar, Area charts
- **Axios** — HTTP client
- **react-hot-toast** — Toast notifications
- **CSS Variables** — Design system (no external CSS framework)

### Backend
- **Flask 3.0** — REST API
- **Flask-CORS** — Cross-origin requests
- **Scikit-learn** — ML pipeline
- **SQLite** — Lightweight database
- **Gunicorn** — Production WSGI server

---

## 📊 Categories

| Category | Icon | Examples |
|----------|------|---------|
| Food | 🍔 | Groceries, restaurants, Zomato, Swiggy |
| Transport | 🚗 | Uber, Ola, petrol, metro card |
| Shopping | 🛍️ | Amazon, Flipkart, clothes, electronics |
| Bills | 📄 | Electricity, internet, Netflix, rent |
| Entertainment | 🎭 | Movies, gaming, concerts |
| Other | 📦 | Medical, pharmacy, miscellaneous |

---


Built as an academic/portfolio project demonstrating full-stack ML integration.

- **Frontend**: React + Recharts + Custom CSS
- **Backend**: Flask + Scikit-learn + SQLite
- **ML**: TF-IDF Vectorization + Multinomial Naive Bayes

  
Author 
Parikshith Urs K
