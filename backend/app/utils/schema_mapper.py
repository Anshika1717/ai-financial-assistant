import pandas as pd

ALIASES = {
    "date": ["date", "transaction_date", "txn_date", "posted_date", "datetime", "time"],
    "amount": ["amount", "amt", "value", "transaction_amount"],
    "type": ["type", "transaction_type", "dr_cr", "debit_credit", "mode"],
    "category": ["category", "spend_category", "group"],
    "merchant": ["merchant", "vendor", "payee", "counterparty"],
    "description": ["description", "details", "remarks", "note", "narration"],
}

def find_column(cols, target):
    lowered = {c.lower().strip(): c for c in cols}
    for alias in ALIASES[target]:
        if alias in lowered:
            return lowered[alias]
    return None

def normalize_transactions(raw_df: pd.DataFrame) -> pd.DataFrame:
    if raw_df.empty:
        raise ValueError("CSV contains no rows")
    cols = list(raw_df.columns)
    mapping = {k: find_column(cols, k) for k in ALIASES}
    if mapping["date"] is None or mapping["amount"] is None:
        raise ValueError("Could not detect required date and amount columns")

    df = pd.DataFrame()
    df["date"] = pd.to_datetime(raw_df[mapping["date"]], errors="coerce")
    df["amount"] = pd.to_numeric(raw_df[mapping["amount"]], errors="coerce")

    if mapping["type"]:
        t = raw_df[mapping["type"]].astype(str).str.strip().str.lower().replace({
            "debit":"expense","dr":"expense","withdrawal":"expense",
            "credit":"income","cr":"income","deposit":"income"
        })
        df["type"] = t
    else:
        df["type"] = raw_df[mapping["amount"]].apply(lambda x: "expense" if str(x).startswith("-") else "income")

    df["amount"] = df["amount"].abs()
    df["category"] = raw_df[mapping["category"]].astype(str) if mapping["category"] else "Other"
    df["merchant"] = raw_df[mapping["merchant"]].astype(str) if mapping["merchant"] else "Unknown"
    df["description"] = raw_df[mapping["description"]].astype(str) if mapping["description"] else ""
    df = df.dropna(subset=["date", "amount"]).copy()
    df["type"] = df["type"].where(df["type"].isin(["income","expense"]), "expense")
    df["month"] = df["date"].dt.to_period("M").astype(str)
    df["hour"] = df["date"].dt.hour
    return df.reset_index(drop=True)
