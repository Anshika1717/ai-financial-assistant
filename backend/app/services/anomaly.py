from sklearn.ensemble import IsolationForest

def detect_anomalies(expense_df):
    if expense_df.empty or len(expense_df) < 4:
        out = expense_df.copy()
        out["anomaly_score"] = 0.0
        return out.iloc[0:0]
    work = expense_df.copy()
    model = IsolationForest(contamination=min(0.15, max(0.03, 5/len(work))), random_state=42)
    scores = model.fit_predict(work[["amount", "hour"]].fillna(0))
    score_vals = model.score_samples(work[["amount", "hour"]].fillna(0))
    work["anomaly_score"] = score_vals
    late_night = (work["hour"] >= 23) | (work["hour"] <= 4)
    unknown = work["merchant"].str.lower().eq("unknown")
    transfer = work["category"].str.lower().eq("transfer")
    suspicious = work[(scores == -1) | (late_night & transfer) | (unknown & (work["amount"] >= 10000))].copy()
    return suspicious.sort_values(["amount", "anomaly_score"], ascending=[False, True])
