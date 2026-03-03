# app.py — FinanceAI Flask Backend
# REST API with JWT auth, per-user data isolation, ML expense categorization

import os
import pickle
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash

# ─── Import model trainer ───────────────────────────────────────
from model.train_model import train_and_save

# ─── App Setup ──────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ─── JWT Configuration ──────────────────────────────────────────
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "dev-secret-change-in-production-f9a3b2c1d4e5"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False   # Token valid until logout
jwt = JWTManager(app)

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
    """Create tables if they don't exist. Migrate existing ones."""
    with get_db() as conn:
        # Users table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                username     TEXT    NOT NULL UNIQUE,
                email        TEXT    NOT NULL UNIQUE,
                password_hash TEXT   NOT NULL,
                created_at   TEXT    DEFAULT (datetime('now'))
            )
        """)

        # Expenses table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL DEFAULT 0,
                description TEXT    NOT NULL,
                amount      REAL    NOT NULL,
                category    TEXT    NOT NULL,
                date        TEXT    NOT NULL,
                created_at  TEXT    DEFAULT (datetime('now'))
            )
        """)

        # Budgets table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL DEFAULT 0,
                category   TEXT    NOT NULL,
                budget     REAL    NOT NULL,
                updated_at TEXT    DEFAULT (datetime('now')),
                UNIQUE(user_id, category)
            )
        """)

        # ── Safe migrations for pre-auth databases ──────────────
        # expenses: add user_id if missing
        existing_cols_exp = [
            row[1] for row in conn.execute("PRAGMA table_info(expenses)").fetchall()
        ]
        if "user_id" not in existing_cols_exp:
            conn.execute("ALTER TABLE expenses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0")
            print("🔄 Migrated expenses table: added user_id column")

        # budgets: old schema had `category TEXT PRIMARY KEY` (no user_id)
        # Need to recreate with new schema if user_id is missing
        existing_cols_bud = [
            row[1] for row in conn.execute("PRAGMA table_info(budgets)").fetchall()
        ]
        if "user_id" not in existing_cols_bud:
            print("🔄 Migrating budgets table to new schema...")
            conn.execute("ALTER TABLE budgets RENAME TO budgets_old")
            conn.execute("""
                CREATE TABLE budgets (
                    id         INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id    INTEGER NOT NULL DEFAULT 0,
                    category   TEXT    NOT NULL,
                    budget     REAL    NOT NULL,
                    updated_at TEXT    DEFAULT (datetime('now')),
                    UNIQUE(user_id, category)
                )
            """)
            # Copy old data (assign to user 0 = pre-auth legacy data)
            conn.execute("""
                INSERT INTO budgets (user_id, category, budget, updated_at)
                SELECT 0, category, budget, updated_at FROM budgets_old
            """)
            conn.execute("DROP TABLE budgets_old")
            print("🔄 Budget migration complete")

        conn.commit()
    print("📦 Database initialized.")



init_db()

# ─── Helpers ────────────────────────────────────────────────────
def get_current_month_range():
    """Return ISO start and end of the current month."""
    now = datetime.now()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        end = now.replace(year=now.year + 1, month=1, day=1)
    else:
        end = now.replace(month=now.month + 1, day=1)
    return start.isoformat(), end.isoformat()

def compute_alerts(conn, user_id):
    """Compare current month spending vs budgets and return alerts."""
    start, end = get_current_month_range()
    budgets = {
        row["category"]: row["budget"]
        for row in conn.execute(
            "SELECT category, budget FROM budgets WHERE user_id = ?", (user_id,)
        ).fetchall()
    }

    if not budgets:
        return []

    expenses = conn.execute(
        "SELECT category, SUM(amount) as total FROM expenses "
        "WHERE user_id = ? AND date >= ? AND date < ? GROUP BY category",
        (user_id, start, end),
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
                "message": (
                    f"⚠️ {cat} budget exceeded by ₹{exceeded_by:,.0f} "
                    f"(Spent ₹{spent:,.0f} / Budget ₹{budget:,.0f})"
                ),
            })
        elif spent >= 0.8 * budget:
            alerts.append({
                "category": cat,
                "budget": budget,
                "spent": spent,
                "exceeded_by": 0,
                "severity": "warning",
                "message": (
                    f"⚠️ {cat} is at {(spent/budget*100):.0f}% of budget "
                    f"(₹{spent:,.0f} / ₹{budget:,.0f})"
                ),
            })

    return alerts

# ═══════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "FinanceAI API is running 🚀"})


@app.route("/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = str(data.get("username", "")).strip()
    email    = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    password_hash = generate_password_hash(password)

    try:
        with get_db() as conn:
            cursor = conn.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                (username, email, password_hash),
            )
            user_id = cursor.lastrowid
            conn.commit()
    except sqlite3.IntegrityError as e:
        if "username" in str(e):
            return jsonify({"error": "Username already taken"}), 409
        return jsonify({"error": "Email already registered"}), 409

    token = create_access_token(identity=str(user_id))
    return jsonify({
        "token": token,
        "user": {"id": user_id, "username": username, "email": email},
        "message": "Account created successfully 🎉",
    }), 201


@app.route("/login", methods=["POST"])
def login():
    """Authenticate and return a JWT token."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email    = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, email, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(row["id"]))
    return jsonify({
        "token": token,
        "user": {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
        },
        "message": "Logged in successfully",
    })


@app.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Return the currently authenticated user's profile."""
    user_id = int(get_jwt_identity())
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, email, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "created_at": row["created_at"],
    })


# ═══════════════════════════════════════════════════════════════
#  PROTECTED ROUTES  (all require JWT)
# ═══════════════════════════════════════════════════════════════

@app.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    """Predict expense category from description using the ML model."""
    data = request.get_json()
    if not data or "description" not in data:
        return jsonify({"error": "Missing 'description' field"}), 400

    description = str(data["description"]).strip()
    if not description:
        return jsonify({"error": "Description cannot be empty"}), 400

    category = pipeline.predict([description])[0]
    proba    = pipeline.predict_proba([description])[0]
    classes  = pipeline.classes_
    confidence = {cls: round(float(p), 3) for cls, p in zip(classes, proba)}

    return jsonify({
        "description": description,
        "category": category,
        "confidence": confidence,
        "top_confidence": round(float(max(proba)), 3),
    })


@app.route("/expense", methods=["POST"])
@jwt_required()
def add_expense():
    """Add a new expense for the authenticated user."""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    required = ["description", "amount"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    description = str(data["description"]).strip()
    amount      = float(data["amount"])
    if amount <= 0:
        return jsonify({"error": "Amount must be positive"}), 400

    category = data.get("category") or pipeline.predict([description])[0]
    date     = data.get("date") or datetime.now().strftime("%Y-%m-%d")

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO expenses (user_id, description, amount, category, date) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_id, description, amount, category, date),
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


@app.route("/expenses", methods=["GET"])
@jwt_required()
def get_expenses():
    """Return all expenses for the authenticated user, newest first."""
    user_id = int(get_jwt_identity())
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC",
            (user_id,),
        ).fetchall()
    return jsonify({"expenses": [dict(r) for r in rows], "count": len(rows)})


@app.route("/expenses/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense (only if it belongs to the authenticated user)."""
    user_id = int(get_jwt_identity())
    with get_db() as conn:
        result = conn.execute(
            "DELETE FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
        conn.commit()
    if result.rowcount == 0:
        return jsonify({"error": "Expense not found"}), 404
    return jsonify({"message": "Expense deleted"})


@app.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    """Monthly summary for the authenticated user."""
    user_id = int(get_jwt_identity())
    start, end = get_current_month_range()
    with get_db() as conn:
        total_row = conn.execute(
            "SELECT SUM(amount) as total, COUNT(*) as cnt FROM expenses "
            "WHERE user_id = ? AND date >= ? AND date < ?",
            (user_id, start, end),
        ).fetchone()
        cat_rows = conn.execute(
            "SELECT category, SUM(amount) as total FROM expenses "
            "WHERE user_id = ? AND date >= ? AND date < ? "
            "GROUP BY category ORDER BY total DESC",
            (user_id, start, end),
        ).fetchall()

    by_category   = {row["category"]: round(row["total"], 2) for row in cat_rows}
    total_spent   = round(total_row["total"] or 0.0, 2)
    expense_count = total_row["cnt"] or 0
    top_category  = cat_rows[0]["category"] if cat_rows else None

    return jsonify({
        "total_spent": total_spent,
        "expense_count": expense_count,
        "by_category": by_category,
        "top_category": top_category,
        "month": datetime.now().strftime("%B %Y"),
    })


@app.route("/budget", methods=["POST"])
@jwt_required()
def set_budget():
    """Set or update a monthly budget for the authenticated user."""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or "category" not in data or "budget" not in data:
        return jsonify({"error": "Missing 'category' or 'budget'"}), 400

    category = str(data["category"]).strip()
    budget   = float(data["budget"])
    if budget <= 0:
        return jsonify({"error": "Budget must be positive"}), 400

    with get_db() as conn:
        conn.execute(
            "INSERT INTO budgets (user_id, category, budget) VALUES (?, ?, ?) "
            "ON CONFLICT(user_id, category) DO UPDATE SET budget=excluded.budget, updated_at=datetime('now')",
            (user_id, category, budget),
        )
        conn.commit()

    return jsonify({
        "category": category,
        "budget": budget,
        "message": f"Budget for {category} set to ₹{budget:,.0f}",
    })


@app.route("/budgets", methods=["GET"])
@jwt_required()
def get_budgets():
    """Return all budgets for the authenticated user."""
    user_id = int(get_jwt_identity())
    with get_db() as conn:
        rows = conn.execute(
            "SELECT category, budget FROM budgets WHERE user_id = ?",
            (user_id,),
        ).fetchall()
    budgets = {row["category"]: row["budget"] for row in rows}
    return jsonify({"budgets": budgets})


@app.route("/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
    """Return budget alerts for the authenticated user."""
    user_id = int(get_jwt_identity())
    with get_db() as conn:
        alerts = compute_alerts(conn, user_id)
    return jsonify({
        "alerts": alerts,
        "count": len(alerts),
        "month": datetime.now().strftime("%B %Y"),
    })


@app.route("/retrain", methods=["POST"])
@jwt_required()
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
