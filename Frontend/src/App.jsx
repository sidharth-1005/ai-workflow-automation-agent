import { useState, useRef, useEffect, useCallback } from "react";

const NODE_TYPES = {
  trigger:   { label: "Trigger",   color: "#0F6E56", bg: "#E1F5EE", border: "#5DCAA5", icon: "⚡" },
  llm:       { label: "LLM",       color: "#3C3489", bg: "#EEEDFE", border: "#7F77DD", icon: "🧠" },
  tool:      { label: "Tool",      color: "#185FA5", bg: "#E6F1FB", border: "#378ADD", icon: "🔧" },
  api:       { label: "API Call",  color: "#854F0B", bg: "#FAEEDA", border: "#EF9F27", icon: "🌐" },
  output:    { label: "Output",    color: "#3B6D11", bg: "#EAF3DE", border: "#639922", icon: "📤" },
  condition: { label: "Condition", color: "#993C1D", bg: "#FAECE7", border: "#D85A30", icon: "◆" },
};

const WORKFLOWS = {
  meeting: {
    name: "Meeting Summary",
    placeholder: "Paste your meeting notes or transcript here...\n\nExample:\nAttendees: Alice, Bob, Carol\nAlice presented Q2 roadmap. Bob raised concerns about timeline. Decided to push launch to July. Carol will send updated spec by Friday.",
    workflowKey: "meeting_summary",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 180, label: "Meeting Notes",       sub: "Text input" },
      { id: "n1", type: "llm",       x: 260, y: 180, label: "Summarize",           sub: "Claude AI" },
      { id: "n2", type: "tool",      x: 460, y: 100, label: "Action Items",        sub: "Extract tasks" },
      { id: "n3", type: "tool",      x: 460, y: 260, label: "Key Decisions",       sub: "Extract decisions" },
      { id: "n4", type: "output",    x: 660, y: 180, label: "Summary",             sub: "Structured output" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "n1", to: "n2" },
      { from: "n1", to: "n3" },
      { from: "n2", to: "n4" },
      { from: "n3", to: "n4" },
    ],
  },
  email: {
    name: "Email Triage",
    placeholder: "Paste an email here...\n\nExample:\nFrom: client@company.com\nSubject: Urgent - Contract Issue\n\nHi, we need to discuss the contract terms before Friday. Can we schedule a call?",
    workflowKey: "email_triage",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 200, label: "Email Input",        sub: "Raw email text" },
      { id: "n1", type: "llm",       x: 260, y: 200, label: "Classify",           sub: "Claude AI" },
      { id: "c1", type: "condition", x: 460, y: 200, label: "Priority?",           sub: "HIGH / MED / LOW" },
      { id: "n2", type: "llm",       x: 660, y: 120, label: "Draft Reply",        sub: "Claude AI" },
      { id: "n3", type: "output",    x: 660, y: 300, label: "Triage Result",      sub: "JSON output" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "n1", to: "c1" },
      { from: "c1", to: "n2" },
      { from: "c1", to: "n3" },
    ],
  },
  data: {
    name: "Data Extraction",
    placeholder: "Paste any unstructured text to extract data from...\n\nExample:\nInvoice from Acme Corp dated March 19 2026. 10 software licenses at $299 each. Tax 8.5%. Total due $3,229 by April 19.",
    workflowKey: "data_extraction",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 200, label: "Document Input",     sub: "Any text" },
      { id: "n1", type: "tool",      x: 260, y: 200, label: "Parse",              sub: "Text extraction" },
      { id: "n2", type: "llm",       x: 460, y: 200, label: "Extract Schema",     sub: "Claude AI" },
      { id: "n3", type: "output",    x: 660, y: 200, label: "Structured JSON",    sub: "Clean data" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
    ],
  },
  report: {
    name: "Report Generator",
    placeholder: "Paste raw data or metrics to generate a report from...\n\nExample:\nQ1 Revenue: $4.2M (+18% YoY)\nNew customers: 41, Churned: 9\nTop deal: FinanceCo $2.1M\nUptime: 99.97%",
    workflowKey: "report",
    nodes: [
      { id: "t1", type: "trigger",   x: 60,  y: 200, label: "Raw Data",           sub: "Metrics / notes" },
      { id: "n1", type: "llm",       x: 260, y: 200, label: "Analyze",            sub: "Claude AI" },
      { id: "n2", type: "tool",      x: 460, y: 200, label: "Format Report",      sub: "Markdown" },
      { id: "n3", type: "output",    x: 660, y: 200, label: "Report",             sub: "Full document" },
    ],
    edges: [
      { from: "t1", to: "n1" },
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
    ],
  },
};

const NODE_W = 160;
const NODE_H = 68;

function Edge({ from, to, nodes, animated }) {
  const a = nodes.find(n => n.id === from);
  const b = nodes.find(n => n.id === to);
  if (!a || !b) return null;
  const x1 = a.x + NODE_W;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x;
  const y2 = b.y + NODE_H / 2;
  const cx = (x1 + x2) / 2;
  const d = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
  return (
    <g>
      <path d={d} fill="none" stroke="#d0cec8" strokeWidth="1.5" />
      <defs>
        <marker id={`a-${from}-${to}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0.5 L5,3 L0,5.5" fill="none" stroke="#b0aea8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <path d={d} fill="none" stroke="#b0aea8" strokeWidth="1.5" markerEnd={`url(#a-${from}-${to})`} />
      {animated && (
        <circle r="5" fill="#7F77DD" opacity="0.85">
          <animateMotion dur="1.5s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

function WorkflowNode({ node, selected, running, done, onClick }) {
  const t = NODE_TYPES[node.type];
  const isRunning = running === node.id;
  const isDone = done.includes(node.id);
  return (
    <g transform={`translate(${node.x},${node.y})`} style={{ cursor: "pointer" }} onClick={() => onClick(node)}>
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
        <g>
          <circle cx={NODE_W - 14} cy="14" r="8" fill={t.color} />
          <text x={NODE_W - 14} y="14" fontSize="10" fill="#fff" textAnchor="middle" dominantBaseline="central">✓</text>
        </g>
      )}
    </g>
  );
}

export default function App() {
  const [activeWf, setActiveWf] = useState("meeting");
  const [selectedNode, setSelectedNode] = useState(null);
  const [running, setRunning] = useState(null);
  const [doneNodes, setDoneNodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [inputText, setInputText] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const logsRef = useRef(null);
  const wf = WORKFLOWS[activeWf];

  useEffect(() => {
    setSelectedNode(null);
    setDoneNodes([]);
    setLogs([]);
    setRunning(null);
    setIsRunning(false);
    setInputText("");
    setAiOutput("");
    setShowOutput(false);
  }, [activeWf]);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const addLog = (nodeId, msg) => {
    setLogs(prev => [...prev, { node: nodeId, msg, ts: new Date().toLocaleTimeString() }]);
  };

  const runWorkflow = useCallback(async () => {
    if (isRunning) return;
    if (!inputText.trim()) {
      alert("Please enter some input text first!");
      return;
    }

    setIsRunning(true);
    setDoneNodes([]);
    setLogs([]);
    setRunning(null);
    setAiOutput("");
    setShowOutput(false);

    const nodes = wf.nodes;

    // Animate through nodes one by one
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      setRunning(node.id);
      addLog(node.id, `${NODE_TYPES[node.type].icon} Running: ${node.label}...`);
      await new Promise(r => setTimeout(r, 800));
      setDoneNodes(prev => [...prev, node.id]);
    }

    // Now make the real API call
    setRunning("api_call");
    addLog(nodes[nodes.length - 1].id, "🌐 Calling Claude AI...");

    try {
      const response = await fetch("http://localhost:8000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: wf.workflowKey,
          input: inputText,
        }),
      });

      const result = await response.json();

      if (result.output) {
        addLog(nodes[nodes.length - 1].id, "✅ Claude AI responded successfully!");
        setAiOutput(result.output);
        setShowOutput(true);
      } else {
        addLog(nodes[nodes.length - 1].id, "⚠️ Error: " + (result.detail || JSON.stringify(result)));
      }
    } catch (err) {
      addLog(nodes[nodes.length - 1].id, "⚠️ Backend not reachable — is it running on port 8000?");
    }

    setRunning(null);
    setIsRunning(false);
  }, [activeWf, isRunning, inputText, wf]);

  const svgW = Math.max(...wf.nodes.map(n => n.x + NODE_W)) + 80;
  const svgH = Math.max(...wf.nodes.map(n => n.y + NODE_H)) + 80;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f7f5f0", fontFamily: "'JetBrains Mono', 'Fira Mono', monospace" }}>

      {/* Header */}
      <div style={{ background: "#1a1917", color: "#f0ede6", padding: "0 20px", display: "flex", alignItems: "center", gap: "16px", height: "52px", flexShrink: 0 }}>
        <span style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "0.05em", color: "#c8c4bc" }}>⚡ FLOW</span>
        <span style={{ color: "#555" }}>|</span>
        <span style={{ fontSize: "13px", color: "#888" }}>AI Workflow Automation Agent</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          {Object.entries(WORKFLOWS).map(([k, w]) => (
            <button key={k} onClick={() => setActiveWf(k)} style={{
              padding: "5px 12px", fontSize: "11px", borderRadius: "6px", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500, letterSpacing: "0.03em",
              background: activeWf === k ? "#7F77DD" : "#2a2927",
              color: activeWf === k ? "#fff" : "#888", transition: "all 0.15s"
            }}>
              {w.name.split(" ")[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left — Input + Canvas */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

          {/* Input area */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e8e5df", padding: "16px 20px", flexShrink: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#2c2c2a", marginBottom: "8px" }}>
              {wf.name} — Input
            </div>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={wf.placeholder}
              style={{
                width: "100%", height: "100px", padding: "10px 12px", fontSize: "12px",
                fontFamily: "inherit", border: "1px solid #dbd9d3", borderRadius: "8px",
                background: "#faf9f7", color: "#2c2c2a", resize: "none", outline: "none",
                boxSizing: "border-box", lineHeight: "1.6"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                onClick={runWorkflow}
                disabled={isRunning}
                style={{
                  padding: "8px 20px", fontSize: "12px", fontWeight: 600, borderRadius: "8px",
                  border: "none", cursor: isRunning ? "not-allowed" : "pointer",
                  background: isRunning ? "#9e9c96" : "#0F6E56", color: "#fff",
                  fontFamily: "inherit", letterSpacing: "0.05em", transition: "all 0.2s"
                }}
              >
                {isRunning ? "⏳ RUNNING..." : "▶ RUN WORKFLOW"}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflow: "auto", position: "relative", background: "#f7f5f0" }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs>
                <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#d8d5cf" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
            <svg width={svgW} height={svgH} style={{ position: "relative", top: 40, left: 40, overflow: "visible" }}>
              {wf.edges.map(e => (
                <Edge key={`${e.from}-${e.to}`} from={e.from} to={e.to} nodes={wf.nodes} animated={isRunning} />
              ))}
              {wf.nodes.map(node => (
                <WorkflowNode key={node.id} node={node} selected={selectedNode?.id === node.id}
                  running={running} done={doneNodes} onClick={setSelectedNode} />
              ))}
            </svg>
          </div>

          {/* Output area */}
          {showOutput && (
            <div style={{ background: "#fff", borderTop: "2px solid #5DCAA5", padding: "16px 20px", maxHeight: "260px", overflow: "auto", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F6E56" }}>✅ Claude AI Output</span>
                <button onClick={() => { setShowOutput(false); setAiOutput(""); }}
                  style={{ marginLeft: "auto", fontSize: "11px", background: "none", border: "1px solid #ddd", borderRadius: "6px", padding: "2px 8px", cursor: "pointer", color: "#888" }}>
                  clear
                </button>
              </div>
              <pre style={{ fontSize: "12px", color: "#2c2c2a", whiteSpace: "pre-wrap", lineHeight: "1.7", margin: 0, fontFamily: "inherit" }}>
                {aiOutput}
              </pre>
            </div>
          )}
        </div>

        {/* Right — Log panel */}
        <div style={{ width: "280px", background: "#1a1917", display: "flex", flexDirection: "column", borderLeft: "1px solid #2a2927", flexShrink: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2927", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#888", letterSpacing: "0.1em" }}>EXECUTION LOG</span>
            {isRunning && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5DCAA5", animation: "pulse 1s infinite" }} />}
          </div>
          <div ref={logsRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {logs.length === 0 && (
              <div style={{ color: "#444", fontSize: "12px", marginTop: "20px", textAlign: "center", lineHeight: "1.6" }}>
                Type your input<br />and click ▶ RUN
              </div>
            )}
            {logs.map((log, i) => {
              const nodeType = wf.nodes.find(n => n.id === log.node)?.type;
              const t = NODE_TYPES[nodeType] || NODE_TYPES.output;
              return (
                <div key={i} style={{ fontSize: "11px", color: "#b0aea8", lineHeight: "1.5", borderLeft: `2px solid ${t.border}`, paddingLeft: "8px" }}>
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
                  { label: "Status", val: aiOutput ? "✅ Done" : "⚠️ Check" },
                  { label: "Model", val: "Claude" },
                  { label: "Output", val: aiOutput ? "Ready" : "—" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#2a2927", borderRadius: "6px", padding: "6px 10px" }}>
                    <div style={{ fontSize: "10px", color: "#555" }}>{stat.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#c8c4bc" }}>{stat.val}</div>
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
        textarea::placeholder { color: #aaa; }
      `}</style>
    </div>
  );
}
