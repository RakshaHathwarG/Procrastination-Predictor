"""
Procrastination Predictor — FastAPI Backend
Uses scikit-learn Logistic Regression to predict student procrastination.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import random

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="Procrastination Predictor API", version="1.0.0")

# Allow the React frontend (any origin in dev) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory prediction history ─────────────────────────────────────────────

prediction_history: List[dict] = []

# ─── Model Training ───────────────────────────────────────────────────────────
# We create a realistic synthetic dataset and train a Logistic Regression model.
# Features: sleep_hours, screen_time, study_hours, stress_level, assignment_completion

def generate_dataset(n_samples: int = 500, seed: int = 42):
    """Generate a realistic synthetic dataset for student procrastination."""
    rng = np.random.default_rng(seed)

    # Sleep: 3–10 hours
    sleep = rng.uniform(3, 10, n_samples)
    # Screen time: 1–12 hours
    screen = rng.uniform(1, 12, n_samples)
    # Study hours: 0–8 hours
    study = rng.uniform(0, 8, n_samples)
    # Stress level: 1–10
    stress = rng.uniform(1, 10, n_samples)
    # Assignment completion: 0–100%
    completion = rng.uniform(0, 100, n_samples)

    X = np.column_stack([sleep, screen, study, stress, completion])

    # Realistic rule: high procrastination if:
    #   - low sleep OR high screen time OR low study OR high stress OR low completion
    score = (
        -0.4 * sleep          # more sleep → less procrastination
        + 0.35 * screen       # more screen → more procrastination
        - 0.5 * study         # more study → less procrastination
        + 0.3 * stress        # more stress → more procrastination
        - 0.025 * completion  # more completion → less procrastination
    )

    # Add noise
    score += rng.normal(0, 0.5, n_samples)

    # Convert to binary label (1 = procrastinates, 0 = does not)
    threshold = np.median(score)
    y = (score > threshold).astype(int)

    return X, y


# Train the model at startup — fast and deterministic
X, y = generate_dataset()
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LogisticRegression(max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

y_pred = model.predict(X_test_scaled)
MODEL_ACCURACY = round(accuracy_score(y_test, y_pred) * 100, 2)

print(f"[ML] Model trained — accuracy: {MODEL_ACCURACY}%")

# ─── Schemas ──────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    sleep_hours: float = Field(..., ge=0, le=24, description="Hours of sleep per night")
    screen_time: float = Field(..., ge=0, le=24, description="Hours of screen time per day")
    study_hours: float = Field(..., ge=0, le=24, description="Hours spent studying per day")
    stress_level: float = Field(..., ge=1, le=10, description="Self-reported stress level (1–10)")
    assignment_completion: float = Field(..., ge=0, le=100, description="Assignment completion percentage")

class PredictResponse(BaseModel):
    prediction: int            # 0 = no procrastination, 1 = procrastination
    label: str                 # "Low Risk" / "Medium Risk" / "High Risk"
    confidence: float          # 0–100 confidence percentage
    model_accuracy: float      # Overall model accuracy on test set
    message: str               # Human-readable message

class HistoryItem(BaseModel):
    id: int
    sleep_hours: float
    screen_time: float
    study_hours: float
    stress_level: float
    assignment_completion: float
    label: str
    confidence: float
    prediction: int

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/healthz")
def health():
    return {"status": "ok"}


@app.get("/api/model-info")
def model_info():
    """Return model accuracy and feature importance info."""
    coefficients = model.coef_[0].tolist()
    feature_names = ["sleep_hours", "screen_time", "study_hours", "stress_level", "assignment_completion"]
    importances = [
        {"feature": name, "coefficient": round(coef, 4)}
        for name, coef in zip(feature_names, coefficients)
    ]
    return {
        "accuracy": MODEL_ACCURACY,
        "model_type": "Logistic Regression",
        "training_samples": len(X_train),
        "feature_importances": importances,
    }


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """Make a procrastination prediction for a student."""
    input_data = np.array([[
        req.sleep_hours,
        req.screen_time,
        req.study_hours,
        req.stress_level,
        req.assignment_completion,
    ]])

    # Scale and predict
    input_scaled = scaler.transform(input_data)
    prediction = int(model.predict(input_scaled)[0])
    proba = model.predict_proba(input_scaled)[0]

    # Confidence = probability of the predicted class
    confidence = round(float(proba[prediction]) * 100, 1)

    # Risk label: bucket by confidence of procrastination
    proc_prob = round(float(proba[1]) * 100, 1)
    if proc_prob < 35:
        label = "Low Risk"
    elif proc_prob < 65:
        label = "Medium Risk"
    else:
        label = "High Risk"

    messages = {
        "Low Risk": "Great habits! You're unlikely to procrastinate. Keep it up!",
        "Medium Risk": "Watch out — some habits may lead to procrastination. Try to balance screen time and study.",
        "High Risk": "High procrastination risk detected. Consider sleeping more, reducing screen time, and boosting study hours.",
    }

    # Save to in-memory history
    entry = {
        "id": len(prediction_history) + 1,
        "sleep_hours": req.sleep_hours,
        "screen_time": req.screen_time,
        "study_hours": req.study_hours,
        "stress_level": req.stress_level,
        "assignment_completion": req.assignment_completion,
        "label": label,
        "confidence": confidence,
        "prediction": prediction,
    }
    prediction_history.append(entry)

    return PredictResponse(
        prediction=prediction,
        label=label,
        confidence=confidence,
        model_accuracy=MODEL_ACCURACY,
        message=messages[label],
    )


@app.get("/api/history", response_model=List[HistoryItem])
def get_history():
    """Return recent prediction history (last 20 entries, newest first)."""
    return list(reversed(prediction_history[-20:]))


@app.delete("/api/history")
def clear_history():
    """Clear all prediction history."""
    prediction_history.clear()
    return {"message": "History cleared"}
