from datetime import datetime, timezone
import pandas as pd
from app.utils.schema_mapper import normalize_transactions
from app.services.anomaly import detect_anomalies
from app.services.summary import build_ai_summary

def analyze_transactions(raw_df: pd.DataFrame, source_name: str) -> dict:
    df = normalize_transactions(raw_df)
    expense_df = df[df["type"] == "expense"].copy()
    income_df = df[df["type"] == "income"].copy()

    total_income = float(income_df["amount"].sum())
    total_expense = float(expense_df["amount"].sum())
    balance = total_income - total_expense

    category_expense = expense_df.groupby("category")["amount"].sum().sort_values(ascending=False)
    monthly_expense = expense_df.groupby("month")["amount"].sum().sort_index()
    anomalies_df = detect_anomalies(expense_df)

    insights = []
    if total_income > 0:
        insights.append(f"Savings rate is {((balance / total_income) * 100):.2f}%.")
    if not category_expense.empty:
        insights.append(f"Highest spending category is {category_expense.index[0]} with amount {float(category_expense.iloc[0]):.2f}.")
    if not monthly_expense.empty:
        insights.append(f"Peak expense month is {monthly_expense.idxmax()} with total spending {float(monthly_expense.max()):.2f}.")
    if not anomalies_df.empty:
        top = anomalies_df.iloc[0]
        insights.append(f"Most suspicious transaction is {top['merchant']} for {float(top['amount']):.2f} on {str(top['date'])}.")
        insights.append(f"Detected {len(anomalies_df)} suspicious transactions.")

    return {
        "success": True,
        "metadata": {
            "source_name": source_name,
            "rows_analyzed": int(len(df)),
            "columns": [str(c) for c in raw_df.columns.tolist()],
            "normalized_columns": [str(c) for c in df.columns.tolist()],
            "min_date": str(df["date"].min()) if not df.empty else None,
            "max_date": str(df["date"].max()) if not df.empty else None,
            "income_total": round(total_income, 2),
            "expense_total": round(total_expense, 2),
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        },
        "analysis": {
            "summary": {
                "income": round(total_income, 2),
                "expense": round(total_expense, 2),
                "balance": round(balance, 2),
                "transactions": int(len(df)),
            },
            "insights": insights,
            "ai_summary": build_ai_summary(df, insights, anomalies_df),
            "charts": {
                "category_expense": [{"category": str(k), "amount": round(float(v), 2)} for k, v in category_expense.items()],
                "monthly_expense": [{"month": str(k), "amount": round(float(v), 2)} for k, v in monthly_expense.items()],
            },
            "suspicious_transactions": anomalies_df[["date","amount","category","merchant","type","anomaly_score"]].assign(
                date=lambda x: x["date"].astype(str),
                amount=lambda x: x["amount"].astype(float).round(2),
                anomaly_score=lambda x: x["anomaly_score"].astype(float).round(4),
            ).to_dict(orient="records"),
        },
    }
