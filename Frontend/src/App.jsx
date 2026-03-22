import { useState, useRef, useEffect, useCallback } from "react";

const NODE_TYPES = {
  trigger:   { label: "Trigger",        color: "#0F6E56", bg: "#E1F5EE", border: "#5DCAA5", icon: "⚡" },
  llm:       { label: "LLM",            color: "#3C3489", bg: "#EEEDFE", border: "#7F77DD", icon: "🧠" },
  tool:      { label: "Tool",           color: "#185FA5", bg: "#E6F1FB", border: "#378ADD", icon: "🔧" },
  api:       { label: "API Call",       color: "#854F0B", bg: "#FAEEDA", border: "#EF9F27", icon: "🌐" },
  output:    { label: "Output",         color: "#3B6D11", bg: "#EAF3DE", border: "#639922", icon: "📤" },
  condition: { label: "Condition",      color: "#993C1D", bg: "#FAECE7", border: "#D85A30", icon: "◆" },
};

const WORKFLOWS = {
  meeting: {
    name: "Meeting Summary Agent",
    description: "Transcribe → summarize → extract action items → send to Notion",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 180, label: "Meeting Transcript",  sub: "Text / audio input" },
      { id: "n1", type: "llm",       x: 260, y: 180, label: "Summarize",           sub: "GPT-4o · temp 0.3" },
      { id: "n2", type: "tool",      x: 460, y: 100, label: "Extract Action Items", sub: "LangChain tool" },
      { id: "n3", type: "tool",      x: 460, y: 260, label: "Key Decisions",        sub: "LangChain tool" },
      { id: "n4", type: "api",       x: 660, y: 180, label: "Notion API",           sub: "POST /pages" },
      { id: "n5", type: "output",    x: 860, y: 180, label: "Summary Page",         sub: "Created in Notion" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "n1", to: "n2" },
      { from: "n1", to: "n3" },
      { from: "n2", to: "n4" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
    ],
  },
  email: {
    name: "Email Triage Agent",
    description: "Classify → prioritize → route → draft reply",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 200, label: "Email Received",      sub: "Gmail webhook" },
      { id: "n1", type: "llm",       x: 260, y: 200, label: "Classify Email",      sub: "Priority · Category" },
      { id: "c1", type: "condition", x: 460, y: 200, label: "Priority?",            sub: "HIGH / MED / LOW" },
      { id: "n2", type: "llm",       x: 660, y: 100, label: "Draft Urgent Reply",  sub: "Immediate action" },
      { id: "n3", type: "tool",      x: 660, y: 300, label: "Add to Queue",        sub: "Low priority inbox" },
      { id: "n4", type: "api",       x: 860, y: 100, label: "Send Reply",           sub: "Gmail API" },
      { id: "n5", type: "output",    x: 860, y: 300, label: "Queued",              sub: "Review later" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "n1", to: "c1" },
      { from: "c1", to: "n2" },
      { from: "c1", to: "n3" },
      { from: "n2", to: "n4" },
      { from: "n3", to: "n5" },
    ],
  },
  data: {
    name: "Data Extraction Pipeline",
    description: "Ingest documents → extract structured JSON → validate → store",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 200, label: "Document Input",     sub: "PDF / text / HTML" },
      { id: "n1", type: "tool",      x: 260, y: 200, label: "Parse Document",     sub: "Text extraction" },
      { id: "n2", type: "llm",       x: 460, y: 200, label: "Extract Schema",     sub: "GPT-4o · temp 0.0" },
      { id: "c1", type: "condition", x: 660, y: 200, label: "Valid JSON?",         sub: "Schema check" },
      { id: "n3", type: "llm",       x: 660, y: 340, label: "Retry Extract",      sub: "Self-heal loop" },
      { id: "n4", type: "api",       x: 860, y: 200, label: "Database API",        sub: "POST /records" },
      { id: "n5", type: "output",    x: 1060,y: 200, label: "Stored Record",      sub: "Structured JSON" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "n1", to: "n2" },
      { from: "n2", to: "c1" },
      { from: "c1", to: "n4" },
      { from: "c1", to: "n3" },
      { from: "n3", to: "n2" },
      { from: "n4", to: "n5" },
    ],
  },
  report: {
    name: "Auto Report Generator",
    description: "Fetch data → analyze → generate report → deliver",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 200, label: "Schedule Trigger",   sub: "Cron: daily 9am" },
      { id: "n1", type: "api",       x: 260, y: 120, label: "Fetch Metrics",      sub: "Analytics API" },
      { id: "n2", type: "api",       x: 260, y: 280, label: "Fetch Sales Data",   sub: "CRM API" },
      { id: "n3", type: "llm",       x: 480, y: 200, label: "Analyze & Report",   sub: "GPT-4o · temp 0.4" },
      { id: "n4", type: "tool",      x: 680, y: 200, label: "Format Report",      sub: "Markdown → PDF" },
      { id: "n5", type: "api",       x: 860, y: 200, label: "Send via Email",     sub: "SMTP / SendGrid" },
      { id: "n6", type: "output",    x: 1060,y: 200, label: "Report Delivered",   sub: "Stakeholders notified" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "t1", to: "n2" },
      { from: "n1", to: "n3" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
      { from: "n5", to: "n6" },
    ],
  },
};

const NODE_W = 160;
const NODE_H = 68;

function getCenter(node) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

function Edge({ from, to, nodes, animated, color = "#888" }) {
  const a = nodes.find(n => n.id === from);
  const b = nodes.find(n => n.id === to);
  if (!a || !b) return null;
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const cx = (x1 + x2) / 2;
  const d = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
  const id = `dot-${from}-${to}`;
  return (
    <g>
      <path d={d} fill="none" stroke="#d0cec8" strokeWidth="1.5" strokeDasharray={animated ? "6 4" : "none"} />
      <path d={d} fill="none" stroke="transparent" strokeWidth="12" />
      {animated && (
        <>
          <defs>
            <marker id={`arr-${from}-${to}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0.5 L5,3 L0,5.5" fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          <circle r="5" fill="#7F77DD" opacity="0.85">
            <animateMotion dur={`${1.2 + Math.random() * 0.6}s`} repeatCount="indefinite" path={d} />
          </circle>
        </>
      )}
      <defs>
        <marker id={`a-${from}-${to}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0.5 L5,3 L0,5.5" fill="none" stroke="#b0ae a8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <path d={d} fill="none" stroke="#b0aea8" strokeWidth="1.5" markerEnd={`url(#a-${from}-${to})`} />
    </g>
  );
}

function WorkflowNode({ node, selected, running, done, onClick }) {
  const t = NODE_TYPES[node.type];
  const isRunning = running === node.id;
  const isDone = done.includes(node.id);
  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(node)}
    >
      <rect
        width={NODE_W} height={NODE_H} rx="10"
        fill={isDone ? t.bg : selected ? t.bg : "#fff"}
        stroke={selected ? t.border : isDone ? t.border : "#dbd9d3"}
        strokeWidth={selected || isDone ? 2 : 1}
        style={{ filter: isRunning ? `drop-shadow(0 0 6px ${t.border})` : "none", transition: "all 0.2s" }}
      />
      {isRunning && (
        <rect width={NODE_W} height={NODE_H} rx="10" fill="none" stroke={t.border} strokeWidth="2" opacity="0.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
        </rect>
      )}
      <text x="14" y="26" fontSize="18" dominantBaseline="central">{t.icon}</text>
      <text x="38" y="24" fontSize="12" fontWeight="500" fill={t.color} fontFamily="monospace">{node.type.toUpperCase()}</text>
      <text x="14" y="46" fontSize="13" fontWeight="500" fill="#2c2c2a" fontFamily="system-ui">{node.label}</text>
      <text x="14" y="60" fontSize="11" fill="#888780" fontFamily="system-ui">{node.sub}</text>
      {isDone && (
        <circle cx={NODE_W - 14} cy="14" r="8" fill={t.color}>
          <text x={NODE_W - 14} y="14" fontSize="10" fill="#fff" textAnchor="middle" dominantBaseline="central">✓</text>
        </circle>
      )}
    </g>
  );
}

const LOGS = {
  meeting: [
    { node: "t1", msg: "▶ Received transcript (2,340 tokens)", ms: 0 },
    { node: "n1", msg: "🧠 Summarizing with GPT-4o...", ms: 800 },
    { node: "n1", msg: "✓ Summary generated (312 tokens)", ms: 2200 },
    { node: "n2", msg: "🔧 Extracting action items...", ms: 2400 },
    { node: "n3", msg: "🔧 Extracting key decisions...", ms: 2400 },
    { node: "n2", msg: "✓ Found 4 action items", ms: 3500 },
    { node: "n3", msg: "✓ Found 3 decisions", ms: 3700 },
    { node: "n4", msg: "🌐 POST /pages → Notion API", ms: 3900 },
    { node: "n4", msg: "✓ 200 OK — page created", ms: 4800 },
    { node: "n5", msg: "📤 Output: notion.so/meeting-2026-03-18", ms: 5000 },
  ],
  email: [
    { node: "t1", msg: "▶ Email webhook received", ms: 0 },
    { node: "n1", msg: "🧠 Classifying email...", ms: 600 },
    { node: "n1", msg: "✓ Priority: HIGH | Category: ACTION_REQUIRED", ms: 1800 },
    { node: "c1", msg: "◆ Condition: HIGH → urgent path", ms: 2000 },
    { node: "n2", msg: "🧠 Drafting urgent reply...", ms: 2200 },
    { node: "n2", msg: "✓ Draft ready (3 paragraphs)", ms: 3400 },
    { node: "n4", msg: "🌐 Gmail API → sending reply...", ms: 3600 },
    { node: "n4", msg: "✓ Reply sent", ms: 4500 },
  ],
  data: [
    { node: "t1", msg: "▶ Invoice PDF received (8 pages)", ms: 0 },
    { node: "n1", msg: "🔧 Parsing PDF text...", ms: 400 },
    { node: "n1", msg: "✓ Extracted 1,840 chars", ms: 1200 },
    { node: "n2", msg: "🧠 Extracting schema (temp=0.0)...", ms: 1400 },
    { node: "n2", msg: "✓ JSON extracted (14 fields)", ms: 2800 },
    { node: "c1", msg: "◆ Validating schema...", ms: 3000 },
    { node: "c1", msg: "✓ Valid JSON — proceeding", ms: 3400 },
    { node: "n4", msg: "🌐 POST /records → Database", ms: 3600 },
    { node: "n4", msg: "✓ 201 Created — id: rec_8f3k2p", ms: 4400 },
    { node: "n5", msg: "📤 Stored: invoice #INV-2026-00847", ms: 4600 },
  ],
  report: [
    { node: "t1", msg: "▶ Cron trigger fired — 09:00 UTC", ms: 0 },
    { node: "n1", msg: "🌐 GET /metrics → Analytics API", ms: 300 },
    { node: "n2", msg: "🌐 GET /deals → CRM API", ms: 300 },
    { node: "n1", msg: "✓ Metrics received (Q1 data)", ms: 1400 },
    { node: "n2", msg: "✓ Sales data received (187 deals)", ms: 1600 },
    { node: "n3", msg: "🧠 Analyzing & writing report...", ms: 1800 },
    { node: "n3", msg: "✓ Report generated (1,200 words)", ms: 4200 },
    { node: "n4", msg: "🔧 Converting Markdown → PDF", ms: 4400 },
    { node: "n4", msg: "✓ PDF ready (2.1 MB)", ms: 5200 },
    { node: "n5", msg: "🌐 SendGrid → emailing 6 stakeholders", ms: 5400 },
    { node: "n6", msg: "📤 Delivered — all recipients confirmed", ms: 6200 },
  ],
};

export default function App() {
  const [activeWf, setActiveWf] = useState("meeting");
  const [selectedNode, setSelectedNode] = useState(null);
  const [running, setRunning] = useState(null);
  const [doneNodes, setDoneNodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const logsRef = useRef(null);
  const wf = WORKFLOWS[activeWf];

  useEffect(() => {
    setSelectedNode(null);
    setDoneNodes([]);
    setLogs([]);
    setRunning(null);
    setIsRunning(false);
    setPan({ x: 0, y: 0 });
  }, [activeWf]);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

const runWorkflow = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setDoneNodes([]);
    setLogs([]);
    setRunning(null);

    const steps = LOGS[activeWf];
    const nodeOrder = [...new Set(steps.map(s => s.node))];

    // Simulate visual animation
    steps.forEach((step, i) => {
      setTimeout(() => {
        setRunning(step.node);
        setLogs(prev => [...prev, { ...step, ts: new Date().toLocaleTimeString() }]);
      }, step.ms);
    });

    nodeOrder.forEach((nid) => {
      const lastStep = [...steps].reverse().find(s => s.node === nid);
      if (lastStep) {
        setTimeout(() => {
          setDoneNodes(prev => [...prev, nid]);
        }, lastStep.ms + 300);
      }
    });

    // Real API call to backend
    const maxMs = Math.max(...steps.map(s => s.ms)) + 3000;
    setTimeout(async () => {
      try {
        const sampleInputs = {
          meeting: "Alice and Bob met on March 19 to discuss Q2 roadmap. Alice will write the product spec by Friday. Bob will set up the CI/CD pipeline by end of month. Decision: use Python for backend.",
          email: "From: boss@company.com\nSubject: Urgent - Client Demo Tomorrow\nWe need the demo ready by 9am tomorrow. Please confirm you can make it happen.",
          data: "Invoice #INV-2026-001 from Acme Corp. Date: March 19 2026. Due: April 19 2026. Items: 10x Software License at $299 each = $2990. Tax: $239. Total: $3229.",
          report: "Q1 2026 Results: Revenue $4.2M (up 18% YoY). New customers: 41. Churn: 9. Uptime: 99.97%. Top win: signed FinanceCo for $2.1M.",
        };

        const workflowMap = {
          meeting: "meeting_summary",
          email: "email_triage",
          data: "data_extraction",
          report: "report",
        };

        const response = await fetch("http://localhost:8000/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflow: workflowMap[activeWf],
            input: sampleInputs[activeWf],
          }),
        });

        const result = await response.json();
        const output = result?.output || result?.detail || JSON.stringify(result);
        setLogs(prev => [
          ...prev,
          { node: wf.nodes[wf.nodes.length - 1].id, msg: "🤖 Claude: " + output.slice(0, 200) + "...", ts: new Date().toLocaleTimeString() }
        ]);
      } catch (err) {
        setLogs(prev => [
          ...prev,
          { node: wf.nodes[wf.nodes.length - 1].id, msg: "⚠️ Backend not connected — showing simulation", ts: new Date().toLocaleTimeString() }
        ]);
      }
      setRunning(null);
      setIsRunning(false);
    }, maxMs);
  }, [activeWf, isRunning]);

  const handleMouseDown = (e) => {
    if (e.target.closest("g[style*='cursor: pointer']")) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  };
  const handleMouseUp = () => setIsPanning(false);

  const svgW = Math.max(...wf.nodes.map(n => n.x + NODE_W)) + 80;
  const svgH = Math.max(...wf.nodes.map(n => n.y + NODE_H)) + 80;

  const sel = selectedNode ? wf.nodes.find(n => n.id === selectedNode.id) : null;
  const selType = sel ? NODE_TYPES[sel.type] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f7f5f0", fontFamily: "'JetBrains Mono', 'Fira Mono', monospace" }}>

      {/* Header */}
      <div style={{ background: "#1a1917", color: "#f0ede6", padding: "0 20px", display: "flex", alignItems: "center", gap: "16px", height: "52px", flexShrink: 0, borderBottom: "1px solid #333" }}>
        <span style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "0.05em", color: "#c8c4bc" }}>⚡ FLOW</span>
        <span style={{ color: "#555", fontSize: "18px" }}>|</span>
        <span style={{ fontSize: "13px", color: "#888", fontWeight: 400 }}>AI Workflow Automation Agent</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          {Object.entries(WORKFLOWS).map(([k, w]) => (
            <button
              key={k}
              onClick={() => setActiveWf(k)}
              style={{
                padding: "5px 12px", fontSize: "11px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, letterSpacing: "0.03em",
                background: activeWf === k ? "#7F77DD" : "#2a2927", color: activeWf === k ? "#fff" : "#888",
                transition: "all 0.15s"
              }}
            >
              {w.name.split(" ")[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e5df", padding: "8px 20px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#2c2c2a" }}>{wf.name}</div>
          <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>{wf.description}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {Object.entries(NODE_TYPES).map(([k, t]) => (
              <span key={k} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: t.bg, color: t.color, border: `1px solid ${t.border}`, fontWeight: 500 }}>
                {t.icon} {t.label}
              </span>
            ))}
          </div>
          <button
            onClick={runWorkflow}
            disabled={isRunning}
            style={{
              padding: "7px 18px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: "none", cursor: isRunning ? "not-allowed" : "pointer",
              background: isRunning ? "#9e9c96" : "#0F6E56", color: "#fff", fontFamily: "inherit", letterSpacing: "0.05em",
              transition: "all 0.2s"
            }}
          >
            {isRunning ? "⏳ RUNNING..." : "▶ RUN WORKFLOW"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Canvas */}
        <div
          style={{ flex: 1, overflow: "hidden", position: "relative", cursor: isPanning ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Dot grid */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <pattern id="dots" x={pan.x % 24} y={pan.y % 24} width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#d8d5cf" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>

          <svg
            width={svgW} height={svgH}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, position: "absolute", top: 40, left: 40, overflow: "visible" }}
          >
            {/* Edges */}
            {wf.edges.map(e => (
              <Edge key={`${e.from}-${e.to}`} from={e.from} to={e.to} nodes={wf.nodes} animated={isRunning} />
            ))}
            {/* Nodes */}
            {wf.nodes.map(node => (
              <WorkflowNode
                key={node.id} node={node}
                selected={selectedNode?.id === node.id}
                running={running} done={doneNodes}
                onClick={setSelectedNode}
              />
            ))}
          </svg>

          {/* Node detail panel */}
          {sel && selType && (
            <div style={{
              position: "absolute", bottom: 20, left: 20, width: "260px",
              background: "#fff", borderRadius: "12px", border: `1.5px solid ${selType.border}`,
              padding: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "20px" }}>{selType.icon}</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: selType.color }}>{selType.label}</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#2c2c2a" }}>{sel.label}</div>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#888", borderTop: "1px solid #f0ede6", paddingTop: "10px" }}>
                <div style={{ marginBottom: "4px" }}><b>Sub:</b> {sel.sub}</div>
                <div style={{ marginBottom: "4px" }}><b>Type:</b> {sel.type}</div>
                <div><b>Status:</b> {doneNodes.includes(sel.id) ? "✅ complete" : running === sel.id ? "⏳ running" : "⬜ idle"}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ marginTop: "10px", fontSize: "11px", background: "none", border: "1px solid #ddd", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", color: "#888" }}>close</button>
            </div>
          )}
        </div>

        {/* Log panel */}
        <div style={{ width: "300px", background: "#1a1917", display: "flex", flexDirection: "column", borderLeft: "1px solid #2a2927", flexShrink: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2927", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#888", letterSpacing: "0.1em" }}>EXECUTION LOG</span>
            {isRunning && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5DCAA5", animation: "pulse 1s infinite" }} />}
            {logs.length > 0 && !isRunning && <span style={{ fontSize: "10px", color: "#5DCAA5", marginLeft: "auto" }}>✓ done</span>}
          </div>
          <div ref={logsRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {logs.length === 0 && (
              <div style={{ color: "#444", fontSize: "12px", marginTop: "20px", textAlign: "center" }}>
                Click <b style={{ color: "#5DCAA5" }}>▶ RUN WORKFLOW</b> to start
              </div>
            )}
            {logs.map((log, i) => {
              const t = NODE_TYPES[wf.nodes.find(n => n.id === log.node)?.type];
              return (
                <div key={i} style={{ fontSize: "11px", color: "#b0aea8", lineHeight: "1.5", borderLeft: `2px solid ${t?.border || "#444"}`, paddingLeft: "8px" }}>
                  <span style={{ color: "#555", marginRight: "6px" }}>{log.ts}</span>
                  <span>{log.msg}</span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          {!isRunning && doneNodes.length > 0 && (
            <div style={{ borderTop: "1px solid #2a2927", padding: "12px 16px" }}>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px", letterSpacing: "0.08em" }}>RUN SUMMARY</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Nodes", val: doneNodes.length },
                  { label: "Duration", val: `${(Math.max(...LOGS[activeWf].map(l => l.ms)) / 1000).toFixed(1)}s` },
                  { label: "Status", val: "Success" },
                  { label: "Output", val: "✓ ready" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#2a2927", borderRadius: "6px", padding: "6px 10px" }}>
                    <div style={{ fontSize: "10px", color: "#555" }}>{stat.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#c8c4bc" }}>{stat.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
}
