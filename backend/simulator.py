"""
simulator.py — Auto-generates sensor data every 2 minutes,
runs ML models, saves to DB and CSV
"""

import random
import numpy as np
import pandas as pd
import threading
import time
import csv
import os
from datetime import datetime

CSV_MOTOR      = "predictions_motor.csv"
CSV_PUMP       = "predictions_pump.csv"
CSV_COMPRESSOR = "predictions_compressor.csv"
CSV_TURBINE    = "predictions_turbine.csv"

HEADERS_MOTOR = ["timestamp","machine_id","product_type","air_temp_k","proc_temp_k",
    "rpm","torque_nm","tool_wear_min","prediction","confidence","risk_level","source"]
HEADERS_PUMP = ["timestamp","machine_id","sensor_00","sensor_02","sensor_03","sensor_04",
    "sensor_05","sensor_06","sensor_07","sensor_08","sensor_09","sensor_10",
    "sensor_11","sensor_12","prediction","confidence","risk_level","source"]
HEADERS_COMPRESSOR = ["timestamp","machine_id","rpm","motor_power_kw","torque_nm",
    "outlet_pressure_bar","air_flow_cfm","noise_db","outlet_temp_c",
    "accel_x","accel_y","accel_z","h_accel_x","h_accel_y","h_accel_z",
    "bearings","prediction","confidence","risk_level","source"]
HEADERS_TURBINE = ["timestamp","machine_id","rpm","temperature_k","pressure_bar",
    "vibration_mms","power_output_mw","prediction","confidence","risk_level","source"]

AUTO_EMAIL = "system.auto@iocl.co.in"

# ─── FAULT PROBABILITIES (tune these to control chart balance) ────────────────
# Motor = 35% fault (highest — most stressed machine)
# Pump  = 25% fault
# Compressor = 20% fault
# Turbine = 15% fault (most reliable)
FAULT_PROB = {
    "motor":      0.35,
    "pump":       0.25,
    "compressor": 0.20,
    "turbine":    0.15,
}

def init_csv():
    for f, h in [
        (CSV_MOTOR, HEADERS_MOTOR),
        (CSV_PUMP, HEADERS_PUMP),
        (CSV_COMPRESSOR, HEADERS_COMPRESSOR),
        (CSV_TURBINE, HEADERS_TURBINE),
    ]:
        if not os.path.exists(f):
            with open(f, 'w', newline='') as fp:
                csv.DictWriter(fp, fieldnames=h).writeheader()
            print(f"  ✅ CSV created: {f}")
        else:
            print(f"  ✅ CSV found: {f}")

def append_csv_motor(row):
    with open(CSV_MOTOR, 'a', newline='') as f:
        csv.DictWriter(f, fieldnames=HEADERS_MOTOR).writerow(
            {h: row.get(h,'') for h in HEADERS_MOTOR})

def append_csv_pump(row):
    with open(CSV_PUMP, 'a', newline='') as f:
        csv.DictWriter(f, fieldnames=HEADERS_PUMP).writerow(
            {h: row.get(h,'') for h in HEADERS_PUMP})

def append_csv_compressor(row):
    with open(CSV_COMPRESSOR, 'a', newline='') as f:
        csv.DictWriter(f, fieldnames=HEADERS_COMPRESSOR).writerow(
            {h: row.get(h,'') for h in HEADERS_COMPRESSOR})

def append_csv_turbine(row):
    with open(CSV_TURBINE, 'a', newline='') as f:
        csv.DictWriter(f, fieldnames=HEADERS_TURBINE).writerow(
            {h: row.get(h,'') for h in HEADERS_TURBINE})

# ─── RANDOM DATA GENERATORS ───────────────────────────────────────────────────

def gen_motor_data():
    fault_mode = random.random() < FAULT_PROB["motor"]
    if fault_mode:
        # Strong fault signals — high torque + high wear + low rpm
        return {
            "product_type":  random.choice(['L', 'M', 'H']),
            "air_temp_k":    round(random.uniform(300.0, 304.0), 2),
            "proc_temp_k":   round(random.uniform(312.0, 316.0), 2),
            "rpm":           round(random.uniform(1168, 1500), 1),
            "torque_nm":     round(random.uniform(60.0, 76.6), 2),
            "tool_wear_min": round(random.uniform(200, 253), 1),
        }
    else:
        # Clear healthy signals
        return {
            "product_type":  random.choice(['L', 'M', 'H']),
            "air_temp_k":    round(random.uniform(295.0, 300.0), 2),
            "proc_temp_k":   round(random.uniform(305.0, 310.0), 2),
            "rpm":           round(random.uniform(1800, 2886), 1),
            "torque_nm":     round(random.uniform(3.8, 40.0), 2),
            "tool_wear_min": round(random.uniform(0, 150), 1),
        }

def gen_pump_data():
    fault_mode = random.random() < FAULT_PROB["pump"]
    sensors = {}
    if fault_mode:
        ranges = {
            "sensor_00": (2.8, 3.5),
            "sensor_02": (60.0, 80.0),
            "sensor_03": (0.3, 0.5),
            "sensor_04": (0.7, 0.9),
            "sensor_05": (0.2, 0.4),
            "sensor_06": (5.0, 6.5),
            "sensor_07": (0.4, 0.6),
            "sensor_08": (3.0, 4.5),
            "sensor_09": (0.2, 0.4),
            "sensor_10": (0.7, 1.0),
            "sensor_11": (0.3, 0.5),
            "sensor_12": (5.0, 6.5),
        }
    else:
        ranges = {
            "sensor_00": (1.0, 2.2),
            "sensor_02": (25.0, 48.0),
            "sensor_03": (0.8, 1.4),
            "sensor_04": (1.1, 1.6),
            "sensor_05": (0.7, 1.1),
            "sensor_06": (1.5, 3.5),
            "sensor_07": (0.9, 1.4),
            "sensor_08": (1.0, 2.2),
            "sensor_09": (0.6, 1.0),
            "sensor_10": (1.3, 2.0),
            "sensor_11": (0.7, 1.1),
            "sensor_12": (1.5, 3.5),
        }
    for k, (lo, hi) in ranges.items():
        sensors[k] = round(random.uniform(lo, hi), 3)
    return sensors

def gen_compressor_data():
    fault_mode = random.random() < FAULT_PROB["compressor"]
    if fault_mode:
        return {
            "rpm":                round(random.uniform(2400, 2650), 1),
            "motor_power":        round(random.uniform(16.5, 19.0), 2),
            "torque":             round(random.uniform(58.0, 72.0), 2),
            "outlet_pressure_bar":round(random.uniform(3.5, 5.5), 2),
            "air_flow":           round(random.uniform(180, 260), 1),
            "noise_db":           round(random.uniform(80, 92), 1),
            "outlet_temp":        round(random.uniform(92, 115), 1),
            "gaccx":              round(random.uniform(0.35, 0.65), 3),
            "gaccy":              round(random.uniform(0.35, 0.65), 3),
            "gaccz":              round(random.uniform(0.35, 0.65), 3),
            "haccx":              round(random.uniform(0.25, 0.55), 3),
            "haccy":              round(random.uniform(0.25, 0.55), 3),
            "haccz":              round(random.uniform(0.25, 0.55), 3),
            "bearings":           round(random.uniform(0.45, 0.85), 3),
        }
    else:
        return {
            "rpm":                round(random.uniform(2800, 3300), 1),
            "motor_power":        round(random.uniform(10.0, 14.5), 2),
            "torque":             round(random.uniform(28.0, 50.0), 2),
            "outlet_pressure_bar":round(random.uniform(6.5, 9.5), 2),
            "air_flow":           round(random.uniform(290, 380), 1),
            "noise_db":           round(random.uniform(60, 74), 1),
            "outlet_temp":        round(random.uniform(68, 87), 1),
            "gaccx":              round(random.uniform(0.005, 0.18), 3),
            "gaccy":              round(random.uniform(0.005, 0.18), 3),
            "gaccz":              round(random.uniform(0.005, 0.18), 3),
            "haccx":              round(random.uniform(0.005, 0.12), 3),
            "haccy":              round(random.uniform(0.005, 0.12), 3),
            "haccz":              round(random.uniform(0.005, 0.12), 3),
            "bearings":           round(random.uniform(0.05, 0.28), 3),
        }

def gen_turbine_data():
    fault_mode = random.random() < FAULT_PROB["turbine"]
    if fault_mode:
        return {
            "rpm":          round(random.uniform(2700, 3050), 1),
            "temperature":  round(random.uniform(580, 660), 1),
            "pressure":     round(random.uniform(16, 22), 2),
            "vibration":    round(random.uniform(3.5, 5.5), 3),
            "power_output": round(random.uniform(45, 65), 1),
        }
    else:
        return {
            "rpm":          round(random.uniform(3150, 3600), 1),
            "temperature":  round(random.uniform(380, 540), 1),
            "pressure":     round(random.uniform(25, 33), 2),
            "vibration":    round(random.uniform(0.3, 2.5), 3),
            "power_output": round(random.uniform(72, 105), 1),
        }

# ─── RUN ONE CYCLE ────────────────────────────────────────────────────────────

def run_cycle(motor_model, motor_scaler, motor_le, motor_features,
              pump_model, pump_scaler, pump_features,
              compressor_model, compressor_scaler, compressor_features,
              turbine_model, turbine_scaler, turbine_features):

    from db import get_connection
    import json

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cur = conn.cursor()

    # ── MOTOR ──────────────────────────────────────────────────────────────────
    try:
        d = gen_motor_data()
        product_type  = str(d["product_type"]).upper()
        air_temp_k    = float(d["air_temp_k"])
        proc_temp_k   = float(d["proc_temp_k"])
        rpm           = float(d["rpm"])
        torque_nm     = float(d["torque_nm"])
        tool_wear_min = float(d["tool_wear_min"])

        type_encoded  = int(motor_le.transform([product_type])[0])
        temp_diff     = proc_temp_k - air_temp_k
        power_w       = torque_nm * rpm * (2 * np.pi / 60)
        torque_x_wear = torque_nm * tool_wear_min
        speed_x_temp  = rpm * proc_temp_k
        wear_stage    = int(pd.cut([tool_wear_min],
            bins=[0,100,200,300,np.inf], labels=[0,1,2,3],
            include_lowest=True)[0])

        row = pd.DataFrame([[type_encoded, air_temp_k, proc_temp_k, rpm,
            torque_nm, tool_wear_min, temp_diff, power_w,
            torque_x_wear, speed_x_temp, wear_stage]], columns=motor_features)
        row_sc = motor_scaler.transform(row)
        prob   = float(motor_model.predict_proba(row_sc)[0, 1])
        label  = int(motor_model.predict(row_sc)[0])

        status     = "FAULTY" if label == 1 else "HEALTHY"
        risk_level = "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"
        confidence = round(prob * 100 if label == 1 else (1 - prob) * 100, 1)

        cur.execute("""
            INSERT INTO motor_predictions
            (product_type, air_temp_k, proc_temp_k, rpm, torque_nm, tool_wear_min,
            `prediction`, status, confidence, fault_type, risk_level, input_data, user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (product_type, air_temp_k, proc_temp_k, rpm, torque_nm, tool_wear_min,
              status, status, confidence, "Auto-Generated", risk_level,
              json.dumps(d), AUTO_EMAIL))

        append_csv_motor({
            "timestamp": timestamp, "machine_id": "AUTO-MTR",
            "product_type": product_type, "air_temp_k": air_temp_k,
            "proc_temp_k": proc_temp_k, "rpm": rpm,
            "torque_nm": torque_nm, "tool_wear_min": tool_wear_min,
            "prediction": status, "confidence": confidence,
            "risk_level": risk_level, "source": "AUTO"
        })
        print(f"  [AUTO] MOTOR → {status} ({confidence}%)")
    except Exception as e:
        print(f"  [AUTO] MOTOR error: {e}")

    # ── PUMP ───────────────────────────────────────────────────────────────────
    try:
        d = gen_pump_data()
        import simulator as sim_module
        row_dict = sim_module.PUMP_SENSOR_DEFAULTS_SIM.copy()
        for feat in pump_features:
            if feat in d:
                row_dict[feat] = float(d[feat])

        row    = pd.DataFrame([row_dict])[pump_features]
        row_sc = pump_scaler.transform(row)
        prob_arr      = pump_model.predict_proba(row_sc)[0]
        label         = int(pump_model.predict(row_sc)[0])
        prob_abnormal = float(prob_arr[1])
        confidence    = round(prob_abnormal * 100 if label == 1 else (1 - prob_abnormal) * 100, 1)

        if label == 0:
            status, risk_level = "NORMAL", "Low"
        else:
            risk_level = "High" if prob_abnormal > 0.75 else "Medium"
            status     = "BROKEN" if prob_abnormal > 0.75 else "RECOVERING"

        cur.execute("""
            INSERT INTO pump_predictions
            (sensor_00, sensor_02, sensor_03, sensor_04, sensor_05, sensor_06,
            sensor_07, sensor_08, sensor_09, sensor_10, sensor_11, sensor_12,
            `prediction`, status, confidence, risk_level, input_data, user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (d.get('sensor_00'), d.get('sensor_02'), d.get('sensor_03'),
              d.get('sensor_04'), d.get('sensor_05'), d.get('sensor_06'),
              d.get('sensor_07'), d.get('sensor_08'), d.get('sensor_09'),
              d.get('sensor_10'), d.get('sensor_11'), d.get('sensor_12'),
              status, status, confidence, risk_level, json.dumps(d), AUTO_EMAIL))

        append_csv_pump({
            "timestamp": timestamp, "machine_id": "AUTO-PMP",
            "sensor_00": d.get('sensor_00'), "sensor_02": d.get('sensor_02'),
            "sensor_03": d.get('sensor_03'), "sensor_04": d.get('sensor_04'),
            "sensor_05": d.get('sensor_05'), "sensor_06": d.get('sensor_06'),
            "sensor_07": d.get('sensor_07'), "sensor_08": d.get('sensor_08'),
            "sensor_09": d.get('sensor_09'), "sensor_10": d.get('sensor_10'),
            "sensor_11": d.get('sensor_11'), "sensor_12": d.get('sensor_12'),
            "prediction": status, "confidence": confidence,
            "risk_level": risk_level, "source": "AUTO"
        })
        print(f"  [AUTO] PUMP → {status} ({confidence}%)")
    except Exception as e:
        print(f"  [AUTO] PUMP error: {e}")

    # ── COMPRESSOR ─────────────────────────────────────────────────────────────
    try:
        d = gen_compressor_data()
        row = pd.DataFrame([d])
        for col in row.columns:
            row[col] = pd.to_numeric(row[col], errors="coerce").fillna(0)
        engineered = row.copy()
        for col in list(row.columns):
            engineered[f"{col}_mean"] = row[col]
            engineered[f"{col}_std"]  = 0
            engineered[f"{col}_max"]  = row[col]
        for feature in compressor_features:
            if feature not in engineered.columns:
                engineered[feature] = 0
        engineered = engineered[compressor_features]
        row_sc = compressor_scaler.transform(engineered)
        prob   = float(compressor_model.predict_proba(row_sc)[0][1])
        label  = int(compressor_model.predict(row_sc)[0])

        if label == 0:
            status, risk_level = "NORMAL", "Low"
            confidence = round((1 - prob) * 100, 2)
        else:
            confidence = round(prob * 100, 2)
            if prob > 0.8:
                status, risk_level = "FAULT", "High"
            else:
                status, risk_level = "DEGRADED", "Medium"

        cur.execute("""
            INSERT INTO compressor_predictions
            (rpm, motor_power, torque, outlet_pressure_bar, air_flow, noise_db,
            outlet_temp, gaccx, gaccy, gaccz, haccx, haccy, haccz, bearings,
            `prediction`, status, confidence, risk_level, input_data, user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (d.get('rpm'), d.get('motor_power'), d.get('torque'),
              d.get('outlet_pressure_bar'), d.get('air_flow'), d.get('noise_db'),
              d.get('outlet_temp'), d.get('gaccx'), d.get('gaccy'),
              d.get('gaccz'), d.get('haccx'), d.get('haccy'),
              d.get('haccz'), d.get('bearings'),
              status, status, confidence, risk_level, json.dumps(d), AUTO_EMAIL))

        append_csv_compressor({
            "timestamp": timestamp, "machine_id": "AUTO-CMP",
            "rpm": d.get('rpm'), "motor_power_kw": d.get('motor_power'),
            "torque_nm": d.get('torque'), "outlet_pressure_bar": d.get('outlet_pressure_bar'),
            "air_flow_cfm": d.get('air_flow'), "noise_db": d.get('noise_db'),
            "outlet_temp_c": d.get('outlet_temp'),
            "accel_x": d.get('gaccx'), "accel_y": d.get('gaccy'), "accel_z": d.get('gaccz'),
            "h_accel_x": d.get('haccx'), "h_accel_y": d.get('haccy'), "h_accel_z": d.get('haccz'),
            "bearings": d.get('bearings'),
            "prediction": status, "confidence": confidence,
            "risk_level": risk_level, "source": "AUTO"
        })
        print(f"  [AUTO] COMPRESSOR → {status} ({confidence}%)")
    except Exception as e:
        print(f"  [AUTO] COMPRESSOR error: {e}")

    # ── TURBINE ────────────────────────────────────────────────────────────────
    try:
        d = gen_turbine_data()
        row = pd.DataFrame([d])
        if turbine_features is not None:
            for col in turbine_features:
                if col not in row.columns:
                    row[col] = 0
            row = row[turbine_features]
        row_sc = turbine_scaler.transform(row)
        prob   = float(turbine_model.predict_proba(row_sc)[0][1])
        label  = int(turbine_model.predict(row_sc)[0])

        status     = "FAULT" if label == 1 else "NORMAL"
        risk_level = "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"
        confidence = round(prob * 100 if label == 1 else (1 - prob) * 100, 2)

        cur.execute("""
            INSERT INTO turbine_predictions
            (rpm, temperature, pressure, vibration, power_output,
            `prediction`, status, confidence, risk_level, input_data, user_email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (d.get('rpm'), d.get('temperature'), d.get('pressure'),
              d.get('vibration'), d.get('power_output'),
              status, status, confidence, risk_level, json.dumps(d), AUTO_EMAIL))

        append_csv_turbine({
            "timestamp": timestamp, "machine_id": "AUTO-TRB",
            "rpm": d.get('rpm'), "temperature_k": d.get('temperature'),
            "pressure_bar": d.get('pressure'), "vibration_mms": d.get('vibration'),
            "power_output_mw": d.get('power_output'),
            "prediction": status, "confidence": confidence,
            "risk_level": risk_level, "source": "AUTO"
        })
        print(f"  [AUTO] TURBINE → {status} ({confidence}%)")
    except Exception as e:
        print(f"  [AUTO] TURBINE error: {e}")

    try:
        conn.commit()
        conn.close()
    except:
        pass

# ─── BACKGROUND THREAD ────────────────────────────────────────────────────────

def start_simulator(motor_model, motor_scaler, motor_le, motor_features,
                    pump_model, pump_scaler, pump_features,
                    compressor_model, compressor_scaler, compressor_features,
                    turbine_model, turbine_scaler, turbine_features,
                    interval_seconds=120):

    import simulator as sim_module
    sim_module.PUMP_SENSOR_DEFAULTS_SIM = {feat: 0.0 for feat in pump_features}

    init_csv()

    def loop():
        print(f"\n  🔄 Auto-simulator started — running every {interval_seconds}s")
        while True:
            print(f"\n  ⏱ [{datetime.now().strftime('%H:%M:%S')}] Running auto-generation cycle...")
            run_cycle(
                motor_model, motor_scaler, motor_le, motor_features,
                pump_model, pump_scaler, pump_features,
                compressor_model, compressor_scaler, compressor_features,
                turbine_model, turbine_scaler, turbine_features
            )
            time.sleep(interval_seconds)

    t = threading.Thread(target=loop, daemon=True)
    t.start()

PUMP_SENSOR_DEFAULTS_SIM = {}