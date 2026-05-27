"""
flask_api.py — Unified prediction API for Motor (AI4I) + Pump
==============================================================
Endpoints:
  POST /predict/motor  →  AI4I machine failure prediction
  POST /predict/pump   →  Pump sensor fault prediction
  GET  /health         →  Check if API is running

Run:
  pip install flask flask-cors joblib scikit-learn xgboost numpy pandas
  python flask_api.py

Your .pkl files must be in the SAME folder as this script:
  Motor : model.pkl, scaler.pkl, label_encoder.pkl, feature_names.pkl
  Pump  : pump_model.pkl, pump_scaler.pkl, pump_feature_names.pkl
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)   # allow requests from your Next.js frontend (localhost:3000)


# ══════════════════════════════════════════════════════════════════════════════
# LOAD MODELS AT STARTUP  (loaded once, reused for every request)
# ══════════════════════════════════════════════════════════════════════════════

print("Loading motor model artefacts...")
try:
    motor_model    = joblib.load("model.pkl")
    motor_scaler   = joblib.load("scaler.pkl")
    motor_le       = joblib.load("label_encoder.pkl")   # L/M/H encoder
    motor_features = joblib.load("feature_names.pkl")
    print("  ✅ Motor model loaded")
except Exception as e:
    print(f"  ❌ Motor model load failed: {e}")
    motor_model = None

print("Loading pump model artefacts...")
try:
    pump_model    = joblib.load("pump_model.pkl")
    pump_scaler   = joblib.load("pump_scaler.pkl")
    pump_features = joblib.load("pump_feature_names.pkl")
    print("  ✅ Pump model loaded")
except Exception as e:
    print(f"  ❌ Pump model load failed: {e}")
    pump_model = None


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "motor_model_loaded": motor_model is not None,
        "pump_model_loaded":  pump_model  is not None,
    })


# ══════════════════════════════════════════════════════════════════════════════
# MOTOR PREDICTION  —  POST /predict/motor
# ══════════════════════════════════════════════════════════════════════════════
#
# Expected JSON body (all fields required):
# {
#   "product_type" : "M",      ← "L", "M", or "H"
#   "air_temp_k"   : 298.1,
#   "proc_temp_k"  : 308.6,
#   "rpm"          : 1500,
#   "torque_nm"    : 42.8,
#   "tool_wear_min": 200
# }
#
# Response:
# {
#   "status"      : "HEALTHY" | "FAULTY",
#   "confidence"  : 94.2,
#   "fault_type"  : "Tool Wear Failure" | "No Failure",
#   "risk_level"  : "Low" | "Medium" | "High",
#   "recommendation": "..."
# }

@app.route("/predict/motor", methods=["POST"])
def predict_motor():
    if motor_model is None:
        return jsonify({"error": "Motor model not loaded. Check model.pkl"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body received"}), 400

    # ── Validate required fields ────────────────────────────────────────────
    required = ["product_type", "air_temp_k", "proc_temp_k", "rpm", "torque_nm", "tool_wear_min"]
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        product_type   = str(data["product_type"]).upper()
        air_temp_k     = float(data["air_temp_k"])
        proc_temp_k    = float(data["proc_temp_k"])
        rpm            = float(data["rpm"])
        torque_nm      = float(data["torque_nm"])
        tool_wear_min  = float(data["tool_wear_min"])

        # ── Encode product type (L/M/H → 0/1/2) ────────────────────────────
        type_encoded = int(motor_le.transform([product_type])[0])

        # ── Recreate engineered features (same as training pipeline) ────────
        temp_diff    = proc_temp_k - air_temp_k
        power_w      = torque_nm * rpm * (2 * np.pi / 60)
        torque_x_wear = torque_nm * tool_wear_min
        speed_x_temp  = rpm * proc_temp_k
        wear_stage    = int(pd.cut(
            [tool_wear_min],
            bins=[0, 100, 200, 300, np.inf],
            labels=[0, 1, 2, 3],
            include_lowest=True
        )[0])

        # ── Build feature row in the exact column order the model expects ───
        row = pd.DataFrame([[
            type_encoded, air_temp_k, proc_temp_k, rpm,
            torque_nm, tool_wear_min,
            temp_diff, power_w, torque_x_wear, speed_x_temp, wear_stage
        ]], columns=motor_features)

        row_sc = motor_scaler.transform(row)

        prob  = float(motor_model.predict_proba(row_sc)[0, 1])
        label = int(motor_model.predict(row_sc)[0])

        # ── Build response ──────────────────────────────────────────────────
        status     = "FAULTY" if label == 1 else "HEALTHY"
        risk_level = "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"
        confidence = round(prob * 100 if label == 1 else (1 - prob) * 100, 1)

        fault_type = "No Failure"
        if label == 1:
            if tool_wear_min > 200:
                fault_type = "Tool Wear Failure"
            elif torque_nm > 60:
                fault_type = "Overstrain Failure"
            elif temp_diff > 12:
                fault_type = "Heat Dissipation Failure"
            else:
                fault_type = "Machine Failure"

        recommendation = {
            "HEALTHY": "Machine operating normally. Continue regular monitoring.",
            "FAULTY":  {
                "High":   "⚠️ IMMEDIATE ACTION REQUIRED. Stop machine and inspect.",
                "Medium": "Schedule maintenance within 48 hours. Monitor closely.",
                "Low":    "Minor anomaly detected. Inspect at next scheduled downtime.",
            }.get(risk_level, "Inspect machine.")
        }[status] if status == "HEALTHY" else {
            "High":   "⚠️ IMMEDIATE ACTION REQUIRED. Stop machine and inspect.",
            "Medium": "Schedule maintenance within 48 hours. Monitor closely.",
            "Low":    "Minor anomaly detected. Inspect at next scheduled downtime.",
        }.get(risk_level, "Inspect machine.")

        return jsonify({
            "status":          status,
            "confidence":      confidence,
            "fault_type":      fault_type,
            "risk_level":      risk_level,
            "failure_probability": round(prob, 4),
            "health_score":    round((1 - prob) * 100, 1),
            "recommendation":  recommendation,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# PUMP PREDICTION  —  POST /predict/pump
# ══════════════════════════════════════════════════════════════════════════════
#
# Expected JSON body (send as many sensors as you have; others get median=0):
# {
#   "sensor_00": 2.45,
#   "sensor_02": 47.3,
#   ...
# }
#
# Response:
# {
#   "status"        : "NORMAL" | "BROKEN" | "RECOVERING",
#   "confidence"    : 91.5,
#   "risk_level"    : "Low" | "Medium" | "High",
#   "recommendation": "..."
# }

# Pre-compute median defaults from training (fallback when sensor not provided)
# These are typical sensor medians — update with values from your actual dataset
PUMP_SENSOR_DEFAULTS: dict = {}   # filled at startup below

def _build_pump_defaults():
    """Build a default value dict (0.0) for every feature the pump model expects."""
    return {feat: 0.0 for feat in pump_features}

if pump_model is not None:
    PUMP_SENSOR_DEFAULTS = _build_pump_defaults()


@app.route("/predict/pump", methods=["POST"])
def predict_pump():
    if pump_model is None:
        return jsonify({"error": "Pump model not loaded. Check pump_model.pkl"}), 500

    data = request.get_json() or {}

    try:
        # ── Build feature row — use provided values, fill rest with 0 ───────
        row_dict = PUMP_SENSOR_DEFAULTS.copy()
        for feat in pump_features:
            if feat in data:
                row_dict[feat] = float(data[feat])

        row    = pd.DataFrame([row_dict])[pump_features]
        row_sc = pump_scaler.transform(row)

        prob_arr = pump_model.predict_proba(row_sc)[0]
        label    = int(pump_model.predict(row_sc)[0])

        # label: 0 = NORMAL, 1 = ABNORMAL (broken/recovering combined)
        prob_abnormal = float(prob_arr[1])
        confidence    = round(prob_abnormal * 100 if label == 1 else (1 - prob_abnormal) * 100, 1)

        # Map back to 3-state friendly label
        if label == 0:
            status     = "NORMAL"
            risk_level = "Low"
            recommendation = "Pump operating normally. No action required."
        else:
            risk_level = "High" if prob_abnormal > 0.75 else "Medium"
            # Heuristic: high confidence abnormal → BROKEN, medium → RECOVERING
            status = "BROKEN" if prob_abnormal > 0.75 else "RECOVERING"
            recommendation = (
                "⚠️ PUMP FAILURE DETECTED. Stop pump immediately and inspect."
                if status == "BROKEN"
                else "Pump in recovery/degraded state. Schedule inspection soon."
            )

        return jsonify({
            "status":              status,
            "confidence":          confidence,
            "risk_level":          risk_level,
            "failure_probability": round(prob_abnormal, 4),
            "recommendation":      recommendation,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# RUN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  Fault Detection API — Motor + Pump")
    print("  Motor endpoint : POST http://127.0.0.1:5000/predict/motor")
    print("  Pump  endpoint : POST http://127.0.0.1:5000/predict/pump")
    print("  Health check   : GET  http://127.0.0.1:5000/health")
    print("="*55 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
