import { useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ShieldAlert,
  IndianRupee,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  CalendarRange,
  Database,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const PIE_COLORS = [
  "#7C3AED",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#14B8A6",
  "#F59E0B",
  "#EC4899",
  "#22C55E",
];

const chartTheme = {
  axis: "#94A3B8",
  grid: "rgba(148, 163, 184, 0.18)",
  tooltipBg: "#0f172a",
  tooltipBorder: "rgba(148, 163, 184, 0.25)",
  bar: "#60A5FA",
};

export default function App() {
  const [file, setFile] = useState(null);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState("none");
  const reqRef = useRef(0);

  async function loadSample() {
    setLoading(true);
    setError("");
    setPayload(null);
    const id = ++reqRef.current;

    try {
      const { data } = await axios.get(`${API}/sample`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (id === reqRef.current) {
        setPayload(data);
        setActiveSource("sample");
        setFile(null);
      }
    } catch (e) {
      if (id === reqRef.current) {
        setError(e?.response?.data?.detail || "Failed to load sample");
      }
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }

  async function analyze() {
    if (!file) {
      setError("Select a CSV file first");
      return;
    }

    setLoading(true);
    setError("");
    setPayload(null);
    const id = ++reqRef.current;

    try {
      const fd = new FormData();
      fd.append("file", file);

      const { data } = await axios.post(`${API}/analyze`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Cache-Control": "no-cache",
        },
      });

      if (id === reqRef.current) {
        setPayload(data);
        setActiveSource("upload");
      }
    } catch (e) {
      if (id === reqRef.current) {
        setError(e?.response?.data?.detail || "Failed to analyze uploaded file");
      }
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }

  const analysis = payload?.analysis;
  const meta = payload?.metadata;
  const pieData = analysis?.charts?.category_expense?.slice(0, 8) || [];
  const barData = analysis?.charts?.monthly_expense || [];
  const suspicious = analysis?.suspicious_transactions || [];

  return (
    <div className="page">
      <div className="hero">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="heroCard"
        >
          <div className="badge">
            <ShieldAlert size={16} />
            Smart finance anomaly scanner
          </div>

          <h1>AI Financial Assistant</h1>
          <p>
            Upload any transaction CSV, auto-detect columns, visualize spending,
            catch anomalies, and get a real summary.
          </p>

          <div className="actions">
            <label className="uploadBtn">
              <Upload size={18} />
              <span>{file ? file.name : "Choose CSV"}</span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setError("");
                }}
                hidden
              />
            </label>

            <button onClick={analyze} disabled={loading}>
              Analyze File
            </button>

            <button className="ghost" onClick={loadSample} disabled={loading}>
              Load Sample
            </button>
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div
                className="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Analyzing latest file...
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </motion.div>
      </div>

      {meta && (
        <section className="glass">
          <div className="sectionTitle">
            <FileSpreadsheet size={18} />
            Analysis proof
          </div>

          <div className="proofBanner">
            <span className={`proofChip ${activeSource}`}>
              {activeSource === "upload" ? "Uploaded file analyzed" : "Sample file analyzed"}
            </span>
            <span className="proofFile">{meta.source_name}</span>
          </div>

          <div className="metaGrid">
            <div>
              <span>File</span>
              <strong>{meta.source_name}</strong>
            </div>
            <div>
              <span>Rows</span>
              <strong>{meta.rows_analyzed}</strong>
            </div>
            <div>
              <span>Date range</span>
              <strong>
                {meta.min_date} to {meta.max_date}
              </strong>
            </div>
            <div>
              <span>Income</span>
              <strong>{money(meta.income_total)}</strong>
            </div>
            <div>
              <span>Expense</span>
              <strong>{money(meta.expense_total)}</strong>
            </div>
            <div>
              <span>Columns</span>
              <strong>{meta.columns.join(", ")}</strong>
            </div>
          </div>
        </section>
      )}

      {analysis && (
        <>
          <section className="stats">
            <div className="stat">
              <IndianRupee />
              <span>Income</span>
              <strong>{money(analysis.summary.income)}</strong>
            </div>

            <div className="stat">
              <Wallet />
              <span>Expense</span>
              <strong>{money(analysis.summary.expense)}</strong>
            </div>

            <div className="stat">
              <BarChart3 />
              <span>Balance</span>
              <strong>{money(analysis.summary.balance)}</strong>
            </div>

            <div className="stat">
              <Database />
              <span>Transactions</span>
              <strong>{analysis.summary.transactions}</strong>
            </div>
          </section>

          <section className="grid2">
            <div className="glass">
              <div className="sectionTitle">
                <TrendingUp size={18} />
                AI summary
              </div>
              <p className="summary">{analysis.ai_summary}</p>
              <ul className="insightList">
                {analysis.insights.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="glass">
              <div className="sectionTitle">
                <BarChart3 size={18} />
                Expense by category
              </div>
              <div className="chartWrap">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="amount"
                      nameKey="category"
                      outerRadius={105}
                      innerRadius={52}
                      paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => money(value)}
                      contentStyle={{
                        backgroundColor: chartTheme.tooltipBg,
                        border: `1px solid ${chartTheme.tooltipBorder}`,
                        borderRadius: "12px",
                        color: "#E2E8F0",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="glass">
            <div className="sectionTitle">
              <CalendarRange size={18} />
              Monthly expense trend
            </div>
            <div className="chartWrap">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke={chartTheme.axis} tick={{ fill: chartTheme.axis }} />
                  <YAxis stroke={chartTheme.axis} tick={{ fill: chartTheme.axis }} />
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: "12px",
                      color: "#E2E8F0",
                    }}
                  />
                  <Bar dataKey="amount" fill={chartTheme.bar} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass">
            <div className="sectionTitle">
              <ShieldAlert size={18} />
              Suspicious transactions
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Merchant</th>
                    <th>Type</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {suspicious.length ? (
                    suspicious.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td>{money(r.amount)}</td>
                        <td>{r.category}</td>
                        <td>{r.merchant}</td>
                        <td>{r.type}</td>
                        <td>{r.anomaly_score}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">No suspicious transactions detected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
