import os

def build_ai_summary(df, insights, anomalies_df):
    base = f"You uploaded {len(df)} transactions across {df['month'].nunique()} months. "
    if not df[df['type']=='expense'].empty:
        top = df[df['type']=='expense'].groupby('category')['amount'].sum().sort_values(ascending=False).head(3)
        base += "Top spend categories are " + ", ".join([f"{k} ({v:.0f})" for k, v in top.items()]) + ". "
    if not anomalies_df.empty:
        base += f"There are {len(anomalies_df)} unusual transactions. "
    if insights:
        base += " ".join(insights[:2])
    if not os.getenv("OPENAI_API_KEY", "").strip():
        return base + " Add an OpenAI API key in backend/.env for a richer LLM summary."
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        prompt = f"Write a concise professional finance summary. Insights: {insights}. Anomalies: {len(anomalies_df)}."
        r = client.responses.create(model="gpt-5-mini", input=prompt)
        return (r.output_text or base).strip()
    except Exception:
        return base
