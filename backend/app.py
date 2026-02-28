# app.py — FinanceAI Flask Backend
# REST API for ML expense categorization, CRUD, budgets, and alerts

import os
import pickle
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# ─── Import model trainer ───────────────────────────────────────
from model.train_model import train_and_save

# ─── App Setup ──────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ─── Paths ──────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "expense_model.pkl")

# Remove stale root-level pkl if it exists (legacy location)
_legacy_pkl = os.path.join(BASE_DIR, "expense_model.pkl")
if os.path.exists(_legacy_pkl):
    os.remove(_legacy_pkl)
    print(f"🗑️  Removed legacy model at {_legacy_pkl}")
DB_PATH = os.path.join(BASE_DIR, "database.db")

# ─── Load or Train Model ────────────────────────────────────────
if not os.path.exists(MODEL_PATH):
    print("⚙️  No saved model found — training now...")
    pipeline, _ = train_and_save(MODEL_PATH)
else:
    print(f"✅ Loading existing model: {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        pipeline = pickle.load(f)

# ─── Database Initialization ────────────────────────────────────
def get_db():
    """Return a database connection with dict-like rows."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they don't exist."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount   REAL  NOT NULL,
                category TEXT  NOT NULL,
                date     TEXT  NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                category TEXT PRIMARY KEY,
                budget   REAL NOT NULL,
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.commit()
    print("📦 Database initialized.")

init_db()

# ─── Helpers ────────────────────────────────────────────────────
def get_current_month_range():
    """Return ISO start and end of the current month."""
    now = datetime.now()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # End of month: go to first of next month
    if now.month == 12:
        end = now.replace(year=now.year + 1, month=1, day=1)
    else:
        end = now.replace(month=now.month + 1, day=1)
    return start.isoformat(), end.isoformat()

def compute_alerts(conn):
    """Compare current month spending vs budgets and return alerts."""
    start, end = get_current_month_range()
    budgets = {row["category"]: row["budget"]
               for row in conn.execute("SELECT * FROM budgets").fetchall()}

    if not budgets:
        return []

    expenses = conn.execute(
        "SELECT category, SUM(amount) as total FROM expenses "
        "WHERE date >= ? AND date < ? GROUP BY category",
        (start, end),
    ).fetchall()

    spent_map = {row["category"]: row["total"] for row in expenses}
    alerts = []

    for cat, budget in budgets.items():
        spent = spent_map.get(cat, 0)
        if spent > budget:
            exceeded_by = spent - budget
            alerts.append({
                "category": cat,
                "budget": budget,
                "spent": spent,
                "exceeded_by": round(exceeded_by, 2),
                "severity": "danger",
                "message": f"⚠️ {cat} budget exceeded by ₹{exceeded_by:,.0f} "
                           f"(Spent ₹{spent:,.0f} / Budget ₹{budget:,.0f})",
            })
        elif spent >= 0.8 * budget:
            alerts.append({
                "category": cat,
                "budget": budget,
                "spent": spent,
                "exceeded_by": 0,
                "severity": "warning",
                "message": f"⚠️ {cat} is at {(spent/budget*100):.0f}% of budget "
                           f"(₹{spent:,.0f} / ₹{budget:,.0f})",
            })

    return alerts

# ═══════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════

# ─── Health Check ───────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "FinanceAI API is running 🚀"})


# ─── POST /predict ──────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    """Predict expense category from description using the ML model."""
    data = request.get_json()
    if not data or "description" not in data:
        return jsonify({"error": "Missing 'description' field"}), 400

    description = str(data["description"]).strip()
    if not description:
        return jsonify({"error": "Description cannot be empty"}), 400

    category = pipeline.predict([description])[0]

    # Confidence probabilities
    proba = pipeline.predict_proba([description])[0]
    classes = pipeline.classes_
    confidence = {cls: round(float(p), 3) for cls, p in zip(classes, proba)}

    return jsonify({
        "description": description,
        "category": category,
        "confidence": confidence,
        "top_confidence": round(float(max(proba)), 3),
    })


# ─── POST /expense ──────────────────────────────────────────────
@app.route("/expense", methods=["POST"])
def add_expense():
    """Add a new expense to the database."""
    data = request.get_json()
    required = ["description", "amount"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    description = str(data["description"]).strip()
    amount = float(data["amount"])
    if amount <= 0:
        return jsonify({"error": "Amount must be positive"}), 400

    # Auto-predict category if not provided
    category = data.get("category") or pipeline.predict([description])[0]
    date = data.get("date") or datetime.now().strftime("%Y-%m-%d")

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)",
            (description, amount, category, date),
        )
        expense_id = cursor.lastrowid
        conn.commit()

    return jsonify({
        "id": expense_id,
        "description": description,
        "amount": amount,
        "category": category,
        "date": date,
        "message": "Expense added successfully",
    }), 201


# ─── GET /expenses ──────────────────────────────────────────────
@app.route("/expenses", methods=["GET"])
def get_expenses():
    """Return all expenses, newest first."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM expenses ORDER BY date DESC, id DESC"
        ).fetchall()
    expenses = [dict(row) for row in rows]
    return jsonify({"expenses": expenses, "count": len(expenses)})


# ─── GET /summary ───────────────────────────────────────────────
@app.route("/summary", methods=["GET"])
def get_summary():
    """Monthly summary: total, category breakdown, top category."""
    start, end = get_current_month_range()
    with get_db() as conn:
        total_row = conn.execute(
            "SELECT SUM(amount) as total, COUNT(*) as cnt FROM expenses "
            "WHERE date >= ? AND date < ?",
            (start, end),
        ).fetchone()
        cat_rows = conn.execute(
            "SELECT category, SUM(amount) as total FROM expenses "
            "WHERE date >= ? AND date < ? GROUP BY category ORDER BY total DESC",
            (start, end),
        ).fetchall()

    by_category = {row["category"]: round(row["total"], 2) for row in cat_rows}
    total_spent = round(total_row["total"] or 0.0, 2)
    expense_count = total_row["cnt"] or 0
    top_category = cat_rows[0]["category"] if cat_rows else None

    return jsonify({
        "total_spent": total_spent,
        "expense_count": expense_count,
        "by_category": by_category,
        "top_category": top_category,
        "month": datetime.now().strftime("%B %Y"),
    })


# ─── POST /budget ────────────────────────────────────────────────
@app.route("/budget", methods=["POST"])
def set_budget():
    """Set or update a monthly budget for a category."""
    data = request.get_json()
    if not data or "category" not in data or "budget" not in data:
        return jsonify({"error": "Missing 'category' or 'budget'"}), 400

    category = str(data["category"]).strip()
    budget = float(data["budget"])
    if budget <= 0:
        return jsonify({"error": "Budget must be positive"}), 400

    with get_db() as conn:
        conn.execute(
            "INSERT INTO budgets (category, budget) VALUES (?, ?) "
            "ON CONFLICT(category) DO UPDATE SET budget=excluded.budget, updated_at=datetime('now')",
            (category, budget),
        )
        conn.commit()

    return jsonify({
        "category": category,
        "budget": budget,
        "message": f"Budget for {category} set to ₹{budget:,.0f}",
    })


# ─── GET /budgets ────────────────────────────────────────────────
@app.route("/budgets", methods=["GET"])
def get_budgets():
    """Return all configured budgets."""
    with get_db() as conn:
        rows = conn.execute("SELECT category, budget FROM budgets").fetchall()
    budgets = {row["category"]: row["budget"] for row in rows}
    return jsonify({"budgets": budgets})


# ─── GET /alerts ─────────────────────────────────────────────────
@app.route("/alerts", methods=["GET"])
def get_alerts():
    """Return budget alerts for the current month."""
    with get_db() as conn:
        alerts = compute_alerts(conn)
    return jsonify({
        "alerts": alerts,
        "count": len(alerts),
        "month": datetime.now().strftime("%B %Y"),
    })


# ─── POST /retrain ────────────────────────────────────────────────
@app.route("/retrain", methods=["POST"])
def retrain():
    """Retrain the ML model on the latest training data and hot-swap it."""
    global pipeline
    try:
        new_pipeline, accuracy = train_and_save(MODEL_PATH)
        pipeline = new_pipeline
        return jsonify({
            "message": "Model retrained successfully",
            "accuracy": round(accuracy * 100, 1),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Run ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n🚀 FinanceAI API running on http://localhost:{port}\n")
    app.run(debug=True, host="0.0.0.0", port=port)
