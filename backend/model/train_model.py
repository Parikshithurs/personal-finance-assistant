# train_model.py
# Trains a TF-IDF + Logistic Regression model for expense categorization.
# Larger, balanced dataset and a stronger classifier fix the "predicts-everything-as-Food" bug.

import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report

# ─────────────────────────────────────────────────────────────────
# TRAINING DATA  –  300 + labeled samples, balanced across 6 categories
# ─────────────────────────────────────────────────────────────────

TRAINING_DATA = [
    # ── Food ──────────────────────────────────────────────────────
    ("lunch at restaurant", "Food"),
    ("breakfast coffee", "Food"),
    ("mcdonalds burger", "Food"),
    ("pizza delivery", "Food"),
    ("grocery shopping", "Food"),
    ("vegetables and fruits", "Food"),
    ("milk eggs bread", "Food"),
    ("dinner at hotel", "Food"),
    ("swiggy order", "Food"),
    ("zomato delivery", "Food"),
    ("chai and snacks", "Food"),
    ("biryani from restaurant", "Food"),
    ("ice cream parlour", "Food"),
    ("bakery items", "Food"),
    ("food court meal", "Food"),
    ("canteen food", "Food"),
    ("cafe coffee", "Food"),
    ("street food", "Food"),
    ("dining out", "Food"),
    ("takeaway food", "Food"),
    ("supermarket groceries", "Food"),
    ("weekly grocery run", "Food"),
    ("dosa idli breakfast", "Food"),
    ("dominos pizza", "Food"),
    ("kfc chicken bucket", "Food"),
    ("subway sandwich", "Food"),
    ("restaurant bill", "Food"),
    ("juice shop", "Food"),
    ("coke pepsi drink", "Food"),
    ("chocolate candy", "Food"),
    ("bought lunch", "Food"),
    ("ordered food online", "Food"),
    ("meat fish chicken", "Food"),
    ("rice dal sabzi", "Food"),
    ("paneer curry", "Food"),
    ("noodles pasta", "Food"),
    ("burger fries", "Food"),
    ("salad bowl", "Food"),
    ("smoothie protein shake", "Food"),
    ("evening snack", "Food"),
    ("hotel breakfast buffet", "Food"),
    ("tiffin box", "Food"),
    ("samosa chaat", "Food"),
    ("pav bhaji", "Food"),
    ("dhaba meal", "Food"),
    ("fruit purchase", "Food"),
    ("vegetable market", "Food"),
    ("meat shop", "Food"),
    ("bakery cake", "Food"),
    ("coffee shop", "Food"),

    # ── Transport ─────────────────────────────────────────────────
    ("uber ride", "Transport"),
    ("ola cab", "Transport"),
    ("petrol filling", "Transport"),
    ("diesel fuel", "Transport"),
    ("auto rickshaw fare", "Transport"),
    ("metro card recharge", "Transport"),
    ("bus ticket", "Transport"),
    ("train ticket booking", "Transport"),
    ("flight ticket", "Transport"),
    ("rapido bike taxi", "Transport"),
    ("toll charge highway", "Transport"),
    ("parking fees", "Transport"),
    ("car service maintenance", "Transport"),
    ("taxi fare", "Transport"),
    ("local train pass", "Transport"),
    ("bike petrol", "Transport"),
    ("vehicle insurance", "Transport"),
    ("driving school fee", "Transport"),
    ("airport transfer", "Transport"),
    ("ferry boat ticket", "Transport"),
    ("cycle rental", "Transport"),
    ("vehicle repair", "Transport"),
    ("tyre puncture repair", "Transport"),
    ("ride sharing", "Transport"),
    ("cab booking", "Transport"),
    ("travel card top up", "Transport"),
    ("meru cab", "Transport"),
    ("intercity bus", "Transport"),
    ("railway reservation", "Transport"),
    ("fuel station", "Transport"),
    ("highway toll", "Transport"),
    ("two wheeler service", "Transport"),
    ("car wash", "Transport"),
    ("scooter rental", "Transport"),
    ("jeep ride", "Transport"),
    ("pickup drop service", "Transport"),
    ("auto fare", "Transport"),
    ("rickshaw charge", "Transport"),
    ("metro token", "Transport"),
    ("bus pass renewal", "Transport"),
    ("cab from airport", "Transport"),
    ("fuel refill", "Transport"),
    ("oil change", "Transport"),
    ("car parking charge", "Transport"),
    ("road trip fuel", "Transport"),
    ("return cab", "Transport"),
    ("travel expense reimbursement", "Transport"),
    ("outstation trip cab", "Transport"),
    ("daily commute", "Transport"),
    ("office transport", "Transport"),

    # ── Shopping ──────────────────────────────────────────────────
    ("amazon order", "Shopping"),
    ("flipkart purchase", "Shopping"),
    ("myntra clothes", "Shopping"),
    ("new shoes", "Shopping"),
    ("jeans tshirt", "Shopping"),
    ("mobile phone purchase", "Shopping"),
    ("laptop purchase", "Shopping"),
    ("headphones earbuds", "Shopping"),
    ("online shopping", "Shopping"),
    ("shirt salwar", "Shopping"),
    ("garments fabric", "Shopping"),
    ("jewellery accessories", "Shopping"),
    ("watch sunglasses", "Shopping"),
    ("home decor items", "Shopping"),
    ("furniture sofa", "Shopping"),
    ("electronics gadget", "Shopping"),
    ("books stationery", "Shopping"),
    ("beauty cosmetics", "Shopping"),
    ("skincare products", "Shopping"),
    ("toys gifts", "Shopping"),
    ("bought clothes", "Shopping"),
    ("new dress", "Shopping"),
    ("kurta pants", "Shopping"),
    ("saree lehenga", "Shopping"),
    ("jacket hoodie", "Shopping"),
    ("sneakers sandals", "Shopping"),
    ("handbag purse", "Shopping"),
    ("belt wallet", "Shopping"),
    ("perfume deodorant", "Shopping"),
    ("shampoo conditioner", "Shopping"),
    ("meesho order", "Shopping"),
    ("ajio purchase", "Shopping"),
    ("nykaa order", "Shopping"),
    ("decathlon sports", "Shopping"),
    ("reliance trends", "Shopping"),
    ("big bazaar shopping", "Shopping"),
    ("phone case cover", "Shopping"),
    ("charger cable", "Shopping"),
    ("earphones wireless", "Shopping"),
    ("smart watch", "Shopping"),
    ("tablet purchase", "Shopping"),
    ("camera lens", "Shopping"),
    ("gaming keyboard mouse", "Shopping"),
    ("office bag", "Shopping"),
    ("umbrella raincoat", "Shopping"),
    ("cap hat", "Shopping"),
    ("sunscreen lotion", "Shopping"),
    ("gift shopping", "Shopping"),
    ("household products", "Shopping"),
    ("detergent soap", "Shopping"),

    # ── Bills ─────────────────────────────────────────────────────
    ("electricity bill", "Bills"),
    ("water bill payment", "Bills"),
    ("internet broadband bill", "Bills"),
    ("mobile recharge", "Bills"),
    ("netflix subscription", "Bills"),
    ("spotify premium", "Bills"),
    ("house rent", "Bills"),
    ("emi payment loan", "Bills"),
    ("insurance premium", "Bills"),
    ("gas cylinder booking", "Bills"),
    ("dth recharge", "Bills"),
    ("credit card bill", "Bills"),
    ("postpaid mobile bill", "Bills"),
    ("cable tv", "Bills"),
    ("amazon prime subscription", "Bills"),
    ("hotstar subscription", "Bills"),
    ("gym membership fee", "Bills"),
    ("society maintenance", "Bills"),
    ("taxes payment", "Bills"),
    ("school fees tuition", "Bills"),
    ("rent payment", "Bills"),
    ("monthly emi", "Bills"),
    ("prepaid recharge", "Bills"),
    ("broadband bill", "Bills"),
    ("power bill", "Bills"),
    ("gas bill", "Bills"),
    ("dth subscription", "Bills"),
    ("disney plus hotstar", "Bills"),
    ("jio recharge", "Bills"),
    ("airtel recharge", "Bills"),
    ("bsnl recharge", "Bills"),
    ("vi vodafone recharge", "Bills"),
    ("home loan emi", "Bills"),
    ("car loan emi", "Bills"),
    ("personal loan emi", "Bills"),
    ("life insurance", "Bills"),
    ("health insurance premium", "Bills"),
    ("term insurance", "Bills"),
    ("mutual fund sip", "Bills"),
    ("rd fd installment", "Bills"),
    ("yearly subscription", "Bills"),
    ("software subscription", "Bills"),
    ("cloud storage plan", "Bills"),
    ("gaming subscription", "Bills"),
    ("newspapers magazine", "Bills"),
    ("cooking gas", "Bills"),
    ("water tanker", "Bills"),
    ("society charges", "Bills"),
    ("building maintenance", "Bills"),
    ("monthly bill payment", "Bills"),

    # ── Entertainment ─────────────────────────────────────────────
    ("movie tickets pvr", "Entertainment"),
    ("bookmyshow booking", "Entertainment"),
    ("concert event pass", "Entertainment"),
    ("gaming recharge pubg", "Entertainment"),
    ("steam games purchase", "Entertainment"),
    ("amusement park entry", "Entertainment"),
    ("zoo museum ticket", "Entertainment"),
    ("karaoke outing", "Entertainment"),
    ("pub bar night out", "Entertainment"),
    ("bowling alley", "Entertainment"),
    ("arcade games", "Entertainment"),
    ("ott platform", "Entertainment"),
    ("youtube premium", "Entertainment"),
    ("esports tournament", "Entertainment"),
    ("party celebration", "Entertainment"),
    ("club entry cover", "Entertainment"),
    ("picnic trip", "Entertainment"),
    ("weekend getaway", "Entertainment"),
    ("adventure sports", "Entertainment"),
    ("cinema hall", "Entertainment"),
    ("imax show", "Entertainment"),
    ("night out friends", "Entertainment"),
    ("escape room", "Entertainment"),
    ("paintball", "Entertainment"),
    ("laser tag", "Entertainment"),
    ("theme park", "Entertainment"),
    ("water park entry", "Entertainment"),
    ("sports match tickets", "Entertainment"),
    ("ipl cricket tickets", "Entertainment"),
    ("stand up comedy show", "Entertainment"),
    ("theatre play", "Entertainment"),
    ("music concert", "Entertainment"),
    ("festival pass", "Entertainment"),
    ("live event", "Entertainment"),
    ("house party supplies", "Entertainment"),
    ("game purchase online", "Entertainment"),
    ("playstation xbox game", "Entertainment"),
    ("ludo chess board game", "Entertainment"),
    ("sport event entry", "Entertainment"),
    ("karting go kart", "Entertainment"),
    ("shooting range", "Entertainment"),
    ("fishing trip", "Entertainment"),
    ("trekking tour", "Entertainment"),
    ("camping gear", "Entertainment"),
    ("beach trip", "Entertainment"),
    ("night club", "Entertainment"),
    ("bar drinks", "Entertainment"),
    ("lounge entry", "Entertainment"),
    ("movie popcorn", "Entertainment"),
    ("binge watching subscription", "Entertainment"),

    # ── Other ─────────────────────────────────────────────────────
    ("medical checkup", "Other"),
    ("hospital bill", "Other"),
    ("medicine pharmacy", "Other"),
    ("charity donation", "Other"),
    ("gift friend birthday", "Other"),
    ("miscellaneous expense", "Other"),
    ("office supplies", "Other"),
    ("workshop seminar fee", "Other"),
    ("bank charges fee", "Other"),
    ("atm withdrawal", "Other"),
    ("laundry dry cleaning", "Other"),
    ("salon haircut", "Other"),
    ("spa massage", "Other"),
    ("pet food vet", "Other"),
    ("plant nursery", "Other"),
    ("home repair", "Other"),
    ("plumber electrician", "Other"),
    ("courier shipping", "Other"),
    ("printing photocopying", "Other"),
    ("subscription other", "Other"),
    ("dentist visit", "Other"),
    ("eye doctor glasses", "Other"),
    ("blood test lab", "Other"),
    ("surgery hospital", "Other"),
    ("physiotherapy session", "Other"),
    ("ayurvedic clinic", "Other"),
    ("birthday gift", "Other"),
    ("wedding gift", "Other"),
    ("donation temple", "Other"),
    ("ngo donation", "Other"),
    ("penalty fine", "Other"),
    ("court fee", "Other"),
    ("notary stamp duty", "Other"),
    ("passport fee", "Other"),
    ("visa application", "Other"),
    ("driving licence renewal", "Other"),
    ("document printing", "Other"),
    ("stationery pens", "Other"),
    ("craft hobby supplies", "Other"),
    ("art materials", "Other"),
    ("tailoring stitching", "Other"),
    ("shoe repair cobbler", "Other"),
    ("watch repair", "Other"),
    ("mobile repair", "Other"),
    ("laptop repair", "Other"),
    ("pest control", "Other"),
    ("AC service", "Other"),
    ("washing machine repair", "Other"),
    ("carpenter work", "Other"),
    ("cleaning service", "Other"),
    ("blood donation camp", "Other"),
]


def train_and_save(model_path="expense_model.pkl"):
    """Train a TF-IDF + Logistic Regression pipeline and save it as pkl."""
    print("=" * 60)
    print("  Personal Finance Assistant — ML Model Training")
    print("=" * 60)

    descriptions, labels = zip(*TRAINING_DATA)
    descriptions = list(descriptions)
    labels = list(labels)

    print(f"\n📊 Dataset size : {len(descriptions)} samples")
    from collections import Counter
    dist = Counter(labels)
    for cat, cnt in sorted(dist.items()):
        print(f"   {cat:<16}: {cnt} samples")
    print(f"📦 Categories   : {sorted(set(labels))}")

    # Train / Test split (stratified to keep category balance)
    X_train, X_test, y_train, y_test = train_test_split(
        descriptions, labels, test_size=0.15, random_state=42, stratify=labels
    )

    # ── Pipeline ──────────────────────────────────────────────────
    # TF-IDF with char n-grams alongside word n-grams gives better
    # recall on short / partial phrases (e.g. "uber", "zomato").
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 3),        # unigrams, bigrams, trigrams
            min_df=1,
            sublinear_tf=True,
            lowercase=True,
            strip_accents='unicode',
            analyzer='word',
        )),
        # Logistic Regression generalises much better than NaiveBayes
        # on short text with a balanced, multi-class dataset.
        ('clf', LogisticRegression(
            max_iter=1000,
            C=5.0,                     # moderate regularisation
            solver='lbfgs',
            random_state=42,
        )),
    ])

    print("\n🔧 Training TF-IDF + Logistic Regression...")
    pipeline.fit(X_train, y_train)

    # Evaluate on held-out test set
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n✅ Training complete!")
    print(f"   Test Accuracy : {accuracy * 100:.1f}%")
    print(f"\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Quick sanity-check predictions
    sanity = [
        ("ride with uber", "Transport"),
        ("electric bill payment", "Bills"),
        ("bought jeans online", "Shopping"),
        ("movie night pvr", "Entertainment"),
        ("hospital checkup", "Other"),
        ("zomato biryani order", "Food"),
        ("petrol filling station", "Transport"),
        ("amazon delivery", "Shopping"),
        ("school fee", "Bills"),
        ("pub night out", "Entertainment"),
    ]
    print("\n🧪 Sanity-check predictions:")
    all_ok = True
    for desc, expected in sanity:
        pred = pipeline.predict([desc])[0]
        ok = "✅" if pred == expected else "❌"
        if pred != expected:
            all_ok = False
        print(f"   {ok}  '{desc}' → {pred}  (expected: {expected})")
    if all_ok:
        print("   All sanity checks passed!")

    # Save model
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)

    print(f"\n💾 Model saved → {model_path}")
    print("=" * 60)
    return pipeline, accuracy


if __name__ == "__main__":
    import os, sys
    # Allow running from any directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "expense_model.pkl")
    train_and_save(model_path)
