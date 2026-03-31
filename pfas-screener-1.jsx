import { useState, useRef, useCallback, useEffect } from "react";

// JSZip loaded via CDN script tag injected at runtime
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

// --- Styles ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0d1117;
    color: #e6edf3;
    font-family: 'Syne', sans-serif;
  }

  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --pine: #0B6339;
    --pine-light: #1a8a52;
    --blue: #2B5D94;
    --blue-light: #4080c0;
    --peacock: #224E5A;
    --red: #da3633;
    --red-light: #ff4444;
    --yellow: #d29922;
    --yellow-light: #f0c040;
    --green: #3fb950;
    --mono: 'DM Mono', monospace;
  }

  .app {
    min-height: 100vh;
    background: var(--bg);
    padding: 0 0 60px;
  }

  .header {
    background: linear-gradient(135deg, #0B6339 0%, #224E5A 50%, #2B5D94 100%);
    padding: 28px 32px 24px;
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(255,255,255,0.02) 20px,
      rgba(255,255,255,0.02) 40px
    );
  }
  .header-inner { position: relative; max-width: 900px; margin: 0 auto; }
  .header-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 3px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .header h1 {
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  .header-sub {
    font-family: var(--mono);
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    margin-top: 8px;
  }

  .main { max-width: 900px; margin: 0 auto; padding: 32px 16px; }

  /* Upload Zone */
  .upload-zone {
    border: 2px dashed var(--border);
    border-radius: 12px;
    padding: 48px 32px;
    text-align: center;
    background: var(--surface);
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--pine-light);
    background: rgba(11,99,57,0.08);
  }
  .upload-zone input { display: none; }
  .upload-icon {
    width: 56px; height: 56px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, var(--pine), var(--blue));
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .upload-zone h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .upload-zone p { font-family: var(--mono); font-size: 12px; color: #7d8590; }

  /* Preview */
  .preview-area {
    margin-top: 20px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .preview-img {
    width: 100%;
    max-height: 320px;
    object-fit: contain;
    background: #000;
    display: block;
  }
  .preview-controls {
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    border-top: 1px solid var(--border);
  }

  /* Buttons */
  .btn {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 14px;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.3px;
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary {
    background: linear-gradient(135deg, var(--pine), var(--pine-light));
    color: #fff;
  }
  .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(11,99,57,0.4); }
  .btn-ghost {
    background: transparent;
    color: #7d8590;
    border: 1px solid var(--border);
  }
  .btn-ghost:hover:not(:disabled) { color: #e6edf3; border-color: #7d8590; }

  /* Status */
  .status-bar {
    margin-top: 20px;
    padding: 14px 20px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    font-family: var(--mono);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #7d8590;
  }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid var(--border);
    border-top-color: var(--pine-light);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Result Card */
  .result-card {
    margin-top: 24px;
    border-radius: 12px;
    border: 1px solid var(--border);
    overflow: hidden;
    background: var(--surface);
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .result-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--border);
  }
  .pfas-badge {
    padding: 5px 14px;
    border-radius: 20px;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    flex-shrink: 0;
  }
  .pfas-detected { background: rgba(218,54,51,0.15); color: var(--red-light); border: 1px solid rgba(218,54,51,0.3); }
  .pfas-clear { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid rgba(63,185,80,0.3); }
  .pfas-unknown { background: rgba(210,153,34,0.15); color: var(--yellow-light); border: 1px solid rgba(210,153,34,0.3); }

  .result-product { font-size: 18px; font-weight: 700; flex: 1; }
  .result-body { padding: 20px; display: grid; gap: 16px; }

  .result-section label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 2px;
    color: #7d8590;
    text-transform: uppercase;
    display: block;
    margin-bottom: 6px;
  }
  .result-section p {
    font-size: 14px;
    line-height: 1.6;
    color: #c9d1d9;
  }

  .chemicals-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
  .chem-tag {
    padding: 3px 10px;
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 11px;
    background: rgba(218,54,51,0.1);
    color: var(--red-light);
    border: 1px solid rgba(218,54,51,0.2);
  }

  .sds-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    background: rgba(43,93,148,0.15);
    border: 1px solid rgba(43,93,148,0.3);
    color: var(--blue-light);
    font-family: var(--mono);
    font-size: 12px;
    text-decoration: none;
    transition: all 0.15s;
    word-break: break-all;
  }
  .sds-link:hover { background: rgba(43,93,148,0.25); }

  .save-btn-row {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  /* Records */
  .records-section { margin-top: 48px; }
  .section-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #7d8590;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
  .badge-count {
    background: var(--pine);
    color: #fff;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    font-family: var(--mono);
  }

  .records-list { display: grid; gap: 12px; }
  .record-row {
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    overflow: hidden;
    display: grid;
    grid-template-columns: 80px 1fr auto;
    align-items: center;
    transition: border-color 0.15s;
  }
  .record-row:hover { border-color: #444c56; }
  .record-row.pfas-yes { border-left: 3px solid var(--red-light); }
  .record-row.pfas-no { border-left: 3px solid var(--green); }
  .record-row.pfas-unk { border-left: 3px solid var(--yellow-light); }

  .record-thumb {
    width: 80px; height: 72px;
    object-fit: cover;
    display: block;
  }
  .record-thumb-placeholder {
    width: 80px; height: 72px;
    background: #21262d;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    color: #444;
  }

  .record-info { padding: 12px 16px; }
  .record-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .record-meta {
    font-family: var(--mono);
    font-size: 11px;
    color: #7d8590;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .record-status { padding: 0 16px; }

  .empty-state {
    text-align: center;
    padding: 48px;
    color: #444c56;
    font-family: var(--mono);
    font-size: 13px;
    border: 1px dashed var(--border);
    border-radius: 10px;
  }

  /* Export Panel */
  .export-panel {
    margin-top: 20px;
    padding: 20px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .export-panel-title {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 2px;
    color: #7d8590;
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .export-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .btn-export {
    background: rgba(43,93,148,0.15);
    border: 1px solid rgba(43,93,148,0.35);
    color: var(--blue-light);
  }
  .btn-export:hover:not(:disabled) {
    background: rgba(43,93,148,0.28);
    transform: translateY(-1px);
  }
  .export-hint {
    margin-top: 10px;
    font-family: var(--mono);
    font-size: 11px;
    color: #555d66;
    line-height: 1.5;
  }

  .badge-new {
    background: var(--blue);
    color: #fff;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    font-family: var(--mono);
    margin-left: 6px;
  }

  .export-last {
    margin-top: 10px;
    font-family: var(--mono);
    font-size: 11px;
    color: #444c56;
    line-height: 1.5;
  }

  .btn-export-zip {
    background: linear-gradient(135deg, rgba(43,93,148,0.25), rgba(34,78,90,0.25));
    border: 1px solid rgba(43,93,148,0.5);
    color: var(--blue-light);
    font-size: 13px;
    padding: 10px 22px;
  }
  .btn-export-zip:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(43,93,148,0.4), rgba(34,78,90,0.4));
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(43,93,148,0.3);
  }
  .btn-export-zip:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .disclaimer {
    margin-top: 32px;
    padding: 16px 20px;
    border-radius: 8px;
    background: rgba(210,153,34,0.08);
    border: 1px solid rgba(210,153,34,0.2);
    font-family: var(--mono);
    font-size: 11px;
    color: var(--yellow-light);
    line-height: 1.6;
  }
  .disclaimer strong { display: block; margin-bottom: 4px; font-size: 12px; }
`;

// --- PFAS-related chemical identifiers to scan for ---
const PFAS_PROMPT = `You are an expert chemist and safety data sheet (SDS) analyst specializing in PFAS (per- and polyfluoroalkyl substances) detection.

The user will provide an image of a product from a Household Hazardous Waste (HHW) facility's free product room.

Your task:
1. IDENTIFY the product (brand name, product name, manufacturer, type/category)
2. SEARCH for its SDS — provide the most likely SDS URL from the manufacturer's website or a trusted SDS database (e.g., msds.com, chemicalsafety.com, ehs.ucsb.edu, manufacturer site). If you cannot find a specific URL, say so clearly.
3. ANALYZE for PFAS — based on your knowledge of this product's formulation and/or its SDS, determine if it likely contains PFAS compounds. PFAS include: PTFE (Teflon), PFOA, PFOS, PFAS, fluoropolymers, fluorosurfactants, fluorotelomers (e.g. 6:2 FT), perfluoroalkyl, polyfluoroalkyl, fluorinated ethylene propylene (FEP), perfluorooctanoic acid, and related compounds.
4. LIST any specific PFAS chemicals identified or likely present.
5. Give a RECOMMENDATION on whether this product should be placed in the free product room.

Respond in this exact JSON format (no markdown, no preamble):
{
  "product_name": "Full product name",
  "manufacturer": "Manufacturer name",
  "product_type": "Category (e.g., lubricant, cleaner, coating, etc.)",
  "pfas_status": "DETECTED" | "NOT_DETECTED" | "UNKNOWN",
  "pfas_chemicals": ["list of specific PFAS chemicals found or suspected, empty array if none"],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "sds_url": "URL or null",
  "sds_note": "Brief note on SDS availability",
  "pfas_analysis": "2-3 sentence explanation of your PFAS determination",
  "recommendation": "ACCEPT" | "REJECT" | "REVIEW",
  "recommendation_note": "Brief reason for your recommendation"
}`;

export default function PFASScreener() {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [drag, setDrag] = useState(false);
  const [lastExportTime, setLastExportTime] = useState(null); // timestamp ms
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef();

  // Load persisted records + lastExportTime from storage on mount
  useEffect(() => {
    const loadStorage = async () => {
      try {
        const r = await window.storage.get("pfas_records");
        if (r) setRecords(JSON.parse(r.value));
      } catch (_) {}
      try {
        const t = await window.storage.get("pfas_last_export");
        if (t) setLastExportTime(parseInt(t.value, 10));
      } catch (_) {}
    };
    loadStorage();

    // Inject JSZip from CDN if not already present
    if (!window.JSZip) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      document.head.appendChild(script);
    }
  }, []);

  // Persist records whenever they change
  useEffect(() => {
    if (records.length === 0) return;
    window.storage.set("pfas_records", JSON.stringify(records)).catch(() => {});
  }, [records]);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage({ dataUrl: e.target.result, file });
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
    setStatus(null);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!image) return;
    setError(null);
    setResult(null);

    try {
      setStatus("Identifying product from image...");
      const base64 = image.dataUrl.split(",")[1];
      const mediaType = image.file.type;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1000,
          system: PFAS_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: mediaType, data: base64 },
                },
                {
                  type: "text",
                  text: "Please analyze this product for PFAS content and provide your assessment in the specified JSON format.",
                },
              ],
            },
          ],
        }),
      });

      setStatus("Processing SDS and PFAS analysis...");
      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      const text = data.content.map((c) => c.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch {
        // Try to extract JSON from the text
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error("Could not parse AI response as JSON.");
      }

      setResult(parsed);
      setStatus(null);
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
      setStatus(null);
    }
  };

  const saveRecord = () => {
    if (!result) return;
    const record = {
      id: Date.now(),
      ...result,
      imageDataUrl: image.dataUrl,
      savedAt: new Date().toLocaleString(),
      savedTimestamp: Date.now(),
    };
    setRecords((prev) => [record, ...prev]);
    setResult(null);
    setImage(null);
  };

  // Returns records saved after lastExportTime (or all if never exported)
  const newRecords = records.filter(
    (r) => !lastExportTime || (r.savedTimestamp || r.id) > lastExportTime
  );

  const exportNewRecords = async () => {
    if (newRecords.length === 0 || exporting) return;
    if (!window.JSZip) {
      alert("JSZip is still loading. Please try again in a moment.");
      return;
    }
    setExporting(true);
    try {
      const zip = new window.JSZip();

      // Build CSV
      const csvHeaders = [
        "ID", "Product Name", "Manufacturer", "Product Type",
        "PFAS Status", "PFAS Chemicals", "Confidence",
        "Recommendation", "Recommendation Note", "PFAS Analysis",
        "SDS URL", "SDS Note", "Saved At", "Photo Filename"
      ];
      const csvEscape = (v) => {
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
      };
      const csvRows = newRecords.map((r, i) => {
        const photoFilename = r.imageDataUrl ? `photo_${r.id}.jpg` : "";
        return [
          r.id, r.product_name, r.manufacturer, r.product_type,
          r.pfas_status, (r.pfas_chemicals || []).join("; "),
          r.confidence, r.recommendation, r.recommendation_note,
          r.pfas_analysis, r.sds_url, r.sds_note, r.savedAt, photoFilename
        ].map(csvEscape).join(",");
      });
      const csvContent = [csvHeaders.join(","), ...csvRows].join("\r\n");
      zip.file("pfas_records.csv", csvContent);

      // Add photos
      for (const r of newRecords) {
        if (r.imageDataUrl) {
          const base64 = r.imageDataUrl.split(",")[1];
          zip.file(`photo_${r.id}.jpg`, base64, { base64: true });
        }
      }

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" });
      const exportDate = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pfas_export_${exportDate}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      // Stamp last export time
      const now = Date.now();
      setLastExportTime(now);
      await window.storage.set("pfas_last_export", String(now));
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const pfasColor = (status) => {
    if (status === "DETECTED") return "pfas-detected";
    if (status === "NOT_DETECTED") return "pfas-clear";
    return "pfas-unknown";
  };
  const pfasLabel = (status) => {
    if (status === "DETECTED") return "⚠ PFAS Detected";
    if (status === "NOT_DETECTED") return "✓ PFAS Clear";
    return "? Unknown";
  };
  const recClass = (status) => {
    if (status === "DETECTED") return "pfas-yes";
    if (status === "NOT_DETECTED") return "pfas-no";
    return "pfas-unk";
  };
  const recBadge = (rec) => {
    if (rec === "ACCEPT") return { label: "Accept", color: "#3fb950" };
    if (rec === "REJECT") return { label: "Reject", color: "#da3633" };
    return { label: "Review", color: "#d29922" };
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div className="header-inner">
            <div className="header-label">Washington County HHW</div>
            <h1>PFAS Product Screener</h1>
            <div className="header-sub">
              Free Product Room · Photo → SDS → PFAS Analysis → Record
            </div>
          </div>
        </div>

        <div className="main">
          {/* Upload Zone */}
          <div
            className={`upload-zone ${drag ? "drag-over" : ""}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <div className="upload-icon">📷</div>
            <h3>{image ? "Tap to change photo" : "Take or Upload Product Photo"}</h3>
            <p>
              {image
                ? image.file.name
                : "Tap to open camera · or drag & drop an image"}
            </p>
          </div>

          {/* Preview */}
          {image && (
            <div className="preview-area">
              <img src={image.dataUrl} alt="Product" className="preview-img" />
              <div className="preview-controls">
                <button
                  className="btn btn-primary"
                  onClick={analyze}
                  disabled={!!status}
                >
                  {status ? (
                    <>
                      <span className="spinner" /> Analyzing...
                    </>
                  ) : (
                    "🔍 Analyze for PFAS"
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setImage(null); setResult(null); setError(null); setStatus(null); }}
                  disabled={!!status}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          {status && (
            <div className="status-bar">
              <span className="spinner" />
              {status}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="status-bar" style={{ color: "#ff6b6b", borderColor: "rgba(218,54,51,0.3)", background: "rgba(218,54,51,0.05)" }}>
              ⚠ {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="result-card">
              <div className="result-header">
                <span className={`pfas-badge ${pfasColor(result.pfas_status)}`}>
                  {pfasLabel(result.pfas_status)}
                </span>
                <span className="result-product">
                  {result.product_name || "Unknown Product"}
                </span>
                {result.recommendation && (() => {
                  const rb = recBadge(result.recommendation);
                  return (
                    <span
                      className="pfas-badge"
                      style={{ color: rb.color, borderColor: rb.color + "44", background: rb.color + "18" }}
                    >
                      {rb.label}
                    </span>
                  );
                })()}
              </div>

              <div className="result-body">
                <div className="result-section">
                  <label>Product Details</label>
                  <p>
                    <strong>{result.manufacturer}</strong> · {result.product_type}
                    {result.confidence && (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#7d8590", marginLeft: 10 }}>
                        Confidence: {result.confidence}
                      </span>
                    )}
                  </p>
                </div>

                <div className="result-section">
                  <label>PFAS Analysis</label>
                  <p>{result.pfas_analysis}</p>
                </div>

                {result.pfas_chemicals && result.pfas_chemicals.length > 0 && (
                  <div className="result-section">
                    <label>PFAS Chemicals Identified</label>
                    <div className="chemicals-list">
                      {result.pfas_chemicals.map((c, i) => (
                        <span key={i} className="chem-tag">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="result-section">
                  <label>Safety Data Sheet</label>
                  <p style={{ marginBottom: 8 }}>{result.sds_note}</p>
                  {result.sds_url ? (
                    <a
                      href={result.sds_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sds-link"
                    >
                      📄 {result.sds_url}
                    </a>
                  ) : (
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#7d8590" }}>
                      No SDS URL available — manual search recommended
                    </span>
                  )}
                </div>

                {result.recommendation_note && (
                  <div className="result-section">
                    <label>Recommendation</label>
                    <p>{result.recommendation_note}</p>
                  </div>
                )}
              </div>

              <div className="save-btn-row">
                <button className="btn btn-ghost" onClick={() => setResult(null)}>
                  Discard
                </button>
                <button className="btn btn-primary" onClick={saveRecord}>
                  💾 Save Record
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="disclaimer">
            <strong>⚠ Important Disclaimer</strong>
            This tool uses AI to assist with PFAS screening. Results are not a substitute for a full SDS review or professional chemical analysis. Always verify the SDS manually before making final acceptance decisions. AI-identified SDS links should be confirmed before use.
          </div>

          {/* Records */}
          <div className="records-section">
            <div className="section-title">
              Product Records
              <span className="badge-count">{records.length}</span>
              {newRecords.length > 0 && (
                <span className="badge-new">{newRecords.length} new</span>
              )}
            </div>

            {records.length > 0 && (
              <div className="export-panel">
                <div className="export-panel-title">Export</div>
                <div className="export-row">
                  <button
                    className="btn btn-export-zip"
                    onClick={exportNewRecords}
                    disabled={newRecords.length === 0 || exporting}
                  >
                    {exporting ? (
                      <><span className="spinner" /> Building ZIP...</>
                    ) : newRecords.length > 0 ? (
                      <>📦 Export {newRecords.length} New Record{newRecords.length !== 1 ? "s" : ""} (.zip)</>
                    ) : (
                      <>✓ All Records Exported</>
                    )}
                  </button>
                </div>
                <div className="export-last">
                  {lastExportTime
                    ? `Last export: ${new Date(lastExportTime).toLocaleString()}`
                    : "No export yet — all records will be included in first export."}
                  {newRecords.length === 0 && records.length > 0 && (
                    <span style={{ marginLeft: 10, color: "var(--green)" }}>✓ Up to date</span>
                  )}
                </div>
                <div className="export-hint">
                  ZIP contains pfas_records.csv + individual photos named photo_[id].jpg · Match by ID column when importing to SharePoint
                </div>
              </div>
            )}

            {records.length === 0 ? (
              <div className="empty-state">
                No records yet — analyze and save a product to begin
              </div>
            ) : (
              <div className="records-list">
                {records.map((r) => (
                  <div key={r.id} className={`record-row ${recClass(r.pfas_status)}`}>
                    {r.imageDataUrl ? (
                      <img src={r.imageDataUrl} alt={r.product_name} className="record-thumb" />
                    ) : (
                      <div className="record-thumb-placeholder">📦</div>
                    )}
                    <div className="record-info">
                      <div className="record-name">{r.product_name}</div>
                      <div className="record-meta">
                        <span>{r.manufacturer}</span>
                        <span>{r.product_type}</span>
                        <span>{r.savedAt}</span>
                        {r.sds_url && (
                          <a
                            href={r.sds_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--blue-light)", textDecoration: "none" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            📄 SDS
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="record-status" style={{ paddingRight: 16 }}>
                      <span className={`pfas-badge ${pfasColor(r.pfas_status)}`} style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                        {pfasLabel(r.pfas_status)}
                      </span>
                      {r.recommendation && (() => {
                        const rb = recBadge(r.recommendation);
                        return (
                          <div style={{ textAlign: "center", marginTop: 6 }}>
                            <span
                              className="pfas-badge"
                              style={{ color: rb.color, borderColor: rb.color + "44", background: rb.color + "18", fontSize: 10 }}
                            >
                              {rb.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
