// src/App.js — Root application shell
import { useState, useEffect, useRef } from "react";
import { createWS } from "./api";
import Overview   from "./pages/Overview";
import Caregivers from "./pages/Caregivers";
import Patients   from "./pages/Patients";
import Alarms     from "./pages/Alarms";
import Analytics  from "./pages/Analytics";
import AssignModal from "./components/AssignModal";

const NAV = [
  { key:"overview",   icon:"📊", label:"Overview"   },
  { key:"caregivers", icon:"👩‍⚕️", label:"Caregivers" },
  { key:"patients",   icon:"🏥", label:"Patients"   },
  { key:"alarms",     icon:"🚨", label:"Alarms"     },
  { key:"analytics",  icon:"📈", label:"Analytics"  },
];

export default function App() {
  const [tab,      setTab]     = useState("overview");
  const [assignAlarm, setAssign]= useState(null);
  const [liveCount, setLiveCount]= useState(0);
  const [connected, setConnected]= useState(false);
  const [toast,    setToast]   = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    try {
      wsRef.current = createWS((msg) => {
        setConnected(true);
        if (msg.type === "vitals_update" && msg.new_alarms?.length > 0) {
          setLiveCount(c => c + msg.new_alarms.length);
          const a = msg.new_alarms[0];
          if (a.severity === "critical") {
            setToast({ msg: `🚨 CRITICAL: ${a.patient_name} — ${a.type?.toUpperCase()}`, color: "#ff4757" });
            setTimeout(() => setToast(null), 5000);
          }
        }
        if (msg.type === "init") setConnected(true);
      });
      wsRef.current.onopen  = () => setConnected(true);
      wsRef.current.onclose = () => setConnected(false);
    } catch {}
    return () => wsRef.current?.close();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", fontFamily: "'Syne', sans-serif", color: "#dde4f0" }}>

      {/* Sidebar */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: "#0a0d16", borderRight: "1px solid #141929",
        display: "flex", flexDirection: "column", zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "26px 22px 22px", borderBottom: "1px solid #141929" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#1e4a8a,#0d2855)",
              border: "1px solid #2d6abf40",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>🏥</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>CareOptimize</div>
              <div style={{ fontSize: 9, color: "#3d87d4", letterSpacing: 1.5, textTransform: "uppercase" }}>AI Engine</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              background: tab===n.key ? "#1e4a8a20" : "transparent",
              border: `1px solid ${tab===n.key ? "#2d6abf40" : "transparent"}`,
              color: tab===n.key ? "#54a0ff" : "#5a6480",
              borderRadius: 10, padding: "10px 14px", cursor: "pointer",
              fontSize: 13, fontWeight: tab===n.key ? 700 : 500,
              fontFamily: "inherit", transition: "all 0.15s",
              marginBottom: 2,
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
              {n.label}
              {n.key==="alarms" && liveCount>0 && (
                <span style={{
                  marginLeft: "auto", background: "#ff4757", color: "#fff",
                  borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800,
                }}>{liveCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Status footer */}
        <div style={{ padding: "14px 18px", borderTop: "1px solid #141929" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: connected ? "#2ed573" : "#ff4757",
              boxShadow: connected ? "0 0 8px #2ed573" : "0 0 8px #ff4757",
            }} />
            <span style={{ fontSize: 11, color: "#5a6480" }}>
              {connected ? "Live monitoring" : "Connecting..."}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#3a4560", marginTop: 6 }}>40 patients · 6 caregivers</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, minHeight: "100vh" }}>
        {/* Topbar */}
        <div style={{
          background: "#0a0d16", borderBottom: "1px solid #141929",
          padding: "0 28px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 90,
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#dde4f0" }}>
            {NAV.find(n=>n.key===tab)?.icon} {NAV.find(n=>n.key===tab)?.label}
          </div>
          <div style={{ fontSize: 12, color: "#5a6480" }}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
            <span style={{ margin:"0 12px",color:"#141929" }}>|</span>
            <span style={{ color: "#2ed573" }}>● Live</span>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {tab==="overview"   && <Overview  onAssign={setAssign} />}
          {tab==="caregivers" && <Caregivers />}
          {tab==="patients"   && <Patients  onAssign={setAssign} />}
          {tab==="alarms"     && <Alarms    onAssign={setAssign} />}
          {tab==="analytics"  && <Analytics />}
        </div>
      </div>

      {/* Assignment modal */}
      {assignAlarm && (
        <AssignModal
          alarm={assignAlarm}
          onClose={() => setAssign(null)}
          onDone={() => setLiveCount(0)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: toast.color + "18", border: `1px solid ${toast.color}50`,
          color: toast.color, borderRadius: 12, padding: "14px 20px",
          fontSize: 13, fontWeight: 700, maxWidth: 340,
          boxShadow: `0 4px 24px ${toast.color}30`,
          animation: "slideIn 0.3s ease",
        }}>
          {toast.msg}
          <style>{`@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        </div>
      )}
    </div>
  );
}
