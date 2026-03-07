// src/pages/Overview.jsx
import { useState, useEffect } from "react";
import { api, RISK_COLOR, STATUS_COLOR } from "../api";
import { Card, StatCard, WBar, SectionHeader, Badge, Btn, RiskBadge, Spinner } from "../components/UI";

export default function Overview({ onAssign }) {
  const [stats,   setStats]   = useState(null);
  const [topRisk, setTopRisk] = useState([]);
  const [workload,setWorkload]= useState([]);
  const [alarms,  setAlarms]  = useState([]);

  const load = async () => {
    const [s, r, w, a] = await Promise.all([
      api.stats(), api.topRisk(8), api.analytics(), api.activeAlarms()
    ]);
    if (s) setStats(s); if (r) setTopRisk(r);
    if (w) setWorkload(w); if (a) setAlarms(a.slice(0,6));
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  if (!stats) return <Spinner />;

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 22 }}>
        <StatCard icon="👥" label="Patients"     value={stats.total_patients}   color="#54a0ff" />
        <StatCard icon="👩‍⚕️" label="Caregivers"  value={stats.total_caregivers}  color="#a29bfe" />
        <StatCard icon="✅" label="Available"    value={stats.available_cgs}     color="#2ed573" />
        <StatCard icon="🔴" label="Critical"     value={stats.critical}          color="#ff4757" />
        <StatCard icon="🟡" label="Warning"      value={stats.warning}           color="#ffa502" />
        <StatCard icon="🚨" label="Active Alarms" value={stats.active_alarms}    color="#ff4757"
          sub={stats.alarm_stats ? `${stats.alarm_stats.total} total` : ""} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Caregiver Workload */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="👩‍⚕️ Caregiver Workload" />
          {workload.map(cg => (
            <div key={cg.name} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 13, color: "#dde4f0", fontWeight: 600 }}>{cg.name}</span>
                  <span style={{ fontSize: 10, color: "#5a6480", marginLeft: 8, textTransform: "uppercase" }}>{cg.role.replace("_"," ")}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#5a6480" }}>{cg.patients}pt</span>
                  <span style={{ fontSize: 11, background: STATUS_COLOR[cg.status]+"1a", color: STATUS_COLOR[cg.status], padding:"1px 8px", borderRadius: 8 }}>
                    {cg.status?.replace("_"," ")}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cg.workload>70?"#ff4757":cg.workload>45?"#ffa502":"#2ed573", width: 38, textAlign:"right" }}>
                    {cg.workload?.toFixed(0)}%
                  </span>
                </div>
              </div>
              <WBar value={cg.workload} height={6} />
            </div>
          ))}
        </Card>

        {/* Active Alarms */}
        <Card style={{ padding: 22 }}>
          <SectionHeader title="🚨 Active Alarms" action={
            <span style={{ fontSize: 11, color: "#5a6480" }}>{alarms.length} unacknowledged</span>
          } />
          {alarms.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#5a6480", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              All clear — no active alarms
            </div>
          ) : alarms.map(a => (
            <div key={a.id} style={{
              background: "#0a0e1a",
              borderLeft: `3px solid ${a.severity==="critical"?"#ff4757":a.severity==="warning"?"#ffa502":"#54a0ff"}`,
              borderRadius: "0 10px 10px 0", padding: "11px 14px", marginBottom: 8,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dde4f0" }}>{a.patient_name}</div>
                <div style={{ fontSize: 11, color: "#5a6480", marginTop: 3 }}>
                  Room {a.room} · {a.type?.toUpperCase()} · {new Date(a.ts).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Badge label={a.severity} color={a.severity==="critical"?"#ff4757":a.severity==="warning"?"#ffa502":"#54a0ff"} />
                <Btn variant="primary" onClick={() => onAssign(a)}>Assign →</Btn>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Top Risk Patients */}
      <Card style={{ padding: 22 }}>
        <SectionHeader title="⚠️ Highest Risk Patients" action={
          <span style={{ fontSize: 11, color: "#5a6480" }}>Auto-sorted by risk score</span>
        } />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {topRisk.map(p => (
            <div key={p.id} style={{
              background: "#0a0e1a", borderRadius: 12, padding: 14,
              borderLeft: `3px solid ${RISK_COLOR(p.risk)}`,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#dde4f0", marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#5a6480" }}>Rm {p.room} · Age {p.age}</div>
              <div style={{ fontSize: 11, color: "#5a6480", marginBottom: 8, textTransform: "capitalize" }}>
                {p.disease} · {p.intensity}/10
              </div>
              <RiskBadge risk={p.risk} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
