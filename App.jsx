import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const P = {
  pink:      '#F9A8C9',
  pinkDark:  '#D9639A',
  pinkBg:    '#FFF0F7',
  mint:      '#5ECDA4',
  mintBg:    '#EDFBF5',
  lav:       '#B4A5E8',
  lavBg:     '#F5F2FF',
  peach:     '#FFBE85',
  peachBg:   '#FFF4EB',
  sky:       '#7FC8F8',
  skyBg:     '#EFF8FF',
  bg:        '#FFF5FA',
  white:     '#FFFFFF',
  text:      '#3D2340',
  textMid:   '#9A6A80',
  textLight: '#CBA8BB',
};

const VITRI = [
  { key: 'truong',   label: 'Gần trường ĐH', icon: '🎓', hs: 1.15 },
  { key: 'vanphong', label: 'Văn phòng',      icon: '🏢', hs: 1.10 },
  { key: 'dancư',    label: 'Khu dân cư',     icon: '🏘️', hs: 0.90 },
  { key: 'mattien',  label: 'Mặt tiền lớn',   icon: '🛣️', hs: 1.20 },
  { key: 'hem',      label: 'Trong hẻm',      icon: '🚪', hs: 0.75 },
];

function predict(inp) {
  const { gia, khach, vitri, choNgoi, delivery, nhanvien, sinhvien, dientich, doithu } = inp;
  const hsV   = VITRI.find(v => v.key === vitri)?.hs || 1.0;
  const hsD   = delivery  ? 1.18 : 1.0;
  const hsC   = choNgoi   ? 1.10 : 0.95;
  const hsS   = sinhvien  ? 1.08 : 1.0;
  const hsDT  = Math.min(Math.max(1 + (dientich - 40) * 0.003, 0.8), 1.3);
  const hsDTh = Math.max(1 - doithu * 0.04, 0.6);
  const nvOk  = nhanvien >= Math.max(1, Math.floor(khach / 30));
  const hsNV  = Math.min(nvOk ? 1 : 0.85 + nhanvien * 0.05, 1);
  const mul   = hsV * hsD * hsC * hsS * hsDT * hsDTh * hsNV;

  const dtTb     = gia * khach * mul;
  const dtThang  = dtTb * 30;
  const chiPhi   = nhanvien * 5e6 + dientich * 2e5 + dtTb * 0.3 * 30;
  const loiNhuan = dtThang - chiPhi;
  const score    = Math.min(100, Math.max(10, Math.round(
    (mul - 0.5) * 70 + Math.min(khach / 200 * 20, 20) + Math.min(gia / 60000 * 10, 10)
  )));
  return {
    dtLow: dtTb * 0.75, dtTb, dtHigh: dtTb * 1.3,
    dtThang, chiPhi, loiNhuan, score,
    luongNV: nhanvien * 5e6,
    matBang: dientich * 2e5,
    nvl: dtTb * 0.3 * 30,
    bars: [
      { name: 'Chậm',    val: +(dtTb * 0.75 / 1e6).toFixed(1) },
      { name: 'TB',      val: +(dtTb       / 1e6).toFixed(1) },
      { name: 'Đông',    val: +(dtTb * 1.3 / 1e6).toFixed(1) },
    ],
  };
}

const fmt  = n => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtM = n => (Math.round(n / 1e5) / 10).toFixed(1) + 'M';

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 50, height: 28, borderRadius: 14, flexShrink: 0, cursor: 'pointer',
      background: value ? P.mint : '#E8D5DF', position: 'relative', transition: 'background .2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 25 : 3,
        width: 22, height: 22, borderRadius: 11, background: P.white,
        transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.18)',
      }} />
    </div>
  );
}

function ScoreRing({ score }) {
  const color = score >= 70 ? P.mint : score >= 45 ? P.peach : P.pink;
  const emoji = score >= 70 ? '🔥' : score >= 45 ? '⚡' : '⚠️';
  const r = 42, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="#F0DEE8" strokeWidth="9" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${score / 100 * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .8s' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: P.text, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: P.textMid }}>/ 100</span>
      </div>
    </div>
  );
}

const card = {
  background: P.white, borderRadius: 20, padding: '15px',
  marginBottom: 10, border: `1px solid ${P.pinkBg}`,
};

export default function App() {
  const [screen, setScreen] = useState(0);
  const [step,   setStep]   = useState(0);
  const [inp,    setInp]    = useState({
    gia: 35000, khach: 80, vitri: 'truong',
    choNgoi: true, delivery: true, nhanvien: 3,
    sinhvien: true, dientich: 40, doithu: 3,
  });
  const [result, setResult] = useState(null);
  const set = (k, v) => setInp(p => ({ ...p, [k]: v }));

  const goNext = () => {
    if (step < 3) { setStep(s => s + 1); }
    else { setResult(predict(inp)); setScreen(2); }
  };
  const goBack = () => {
    if (step > 0) setStep(s => s - 1);
    else setScreen(0);
  };

  const sliderAccent = [P.pink, P.lav, P.mint, P.peach][step] || P.pink;

  // ── HOME ──────────────────────────────────────────────────────────
  if (screen === 0) return (
    <div style={{
      height: 620, background: P.bg, borderRadius: 32,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 28px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ fontSize: 72, marginBottom: 10 }}>☕</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {[['🧋', P.pinkBg], ['🍵', P.mintBg], ['🥤', P.skyBg]].map(([e, bg], i) => (
          <div key={i} style={{ background: bg, borderRadius: 18, padding: '10px 14px', fontSize: 26 }}>{e}</div>
        ))}
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: P.text, textAlign: 'center', margin: '0 0 10px', lineHeight: 1.35 }}>
        Dự đoán doanh thu<br />quán trà sữa ✨
      </h1>
      <p style={{ color: P.textMid, textAlign: 'center', fontSize: 13.5, margin: '0 0 28px', lineHeight: 1.65, maxWidth: 270 }}>
        Nhập thông tin quán của bạn, AI sẽ dự đoán doanh thu và đưa ra lời khuyên thực tế 🌟
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 30 }}>
        {[['📊 Dự đoán', P.pinkBg, P.pinkDark], ['💡 Gợi ý', P.mintBg, P.mint], ['📈 Biểu đồ', P.skyBg, P.sky]].map(([t, bg, c], i) => (
          <div key={i} style={{ background: bg, borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 700, color: c }}>{t}</div>
        ))}
      </div>

      <button onClick={() => setScreen(1)} style={{
        background: P.pink, color: P.white, border: 'none',
        borderRadius: 26, padding: '16px 0', fontSize: 17, fontWeight: 700,
        cursor: 'pointer', width: '100%', maxWidth: 300,
      }}>
        Bắt đầu ngay →
      </button>
      <p style={{ color: P.textLight, fontSize: 12, marginTop: 14 }}>🆓 Miễn phí · Không cần đăng ký</p>
    </div>
  );

  // ── INPUT ─────────────────────────────────────────────────────────
  if (screen === 1) {
    const STEP_LABELS = ['Vị trí & Giá', 'Khách & Nhân viên', 'Tiện ích', 'Không gian'];
    return (
      <div style={{
        height: 620, background: P.bg, borderRadius: 32,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: P.white, padding: '18px 16px 0', borderBottom: `1px solid ${P.pinkBg}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <button onClick={goBack} style={{
              background: P.pinkBg, border: 'none', borderRadius: 12,
              width: 36, height: 36, fontSize: 18, cursor: 'pointer', flexShrink: 0,
            }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: P.textMid }}>Bước {step + 1} / 4</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: P.text }}>{STEP_LABELS[step]}</div>
            </div>
            <div style={{
              background: P.pinkBg, borderRadius: 12, padding: '5px 12px',
              fontSize: 12, fontWeight: 800, color: P.pinkDark,
            }}>{Math.round(((step + 1) / 4) * 100)}%</div>
          </div>
          <div style={{ height: 5, background: '#F0DEE8', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, background: P.pink,
              width: `${((step + 1) / 4) * 100}%`, transition: 'width .3s',
            }} />
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0' }}>

          {/* STEP 0 — Vị trí & Giá */}
          {step === 0 && <>
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.textMid, marginBottom: 10 }}>📍 Vị trí quán</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {VITRI.map(v => (
                  <div key={v.key} onClick={() => set('vitri', v.key)} style={{
                    border: `2px solid ${inp.vitri === v.key ? P.pink : '#F0DEE8'}`,
                    borderRadius: 14, padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
                    background: inp.vitri === v.key ? P.pinkBg : P.white, transition: 'all .18s',
                  }}>
                    <div style={{ fontSize: 22 }}>{v.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: inp.vitri === v.key ? P.pinkDark : P.textMid, marginTop: 4 }}>{v.label}</div>
                    <div style={{ fontSize: 10, color: P.textLight }}>×{v.hs}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: P.textMid }}>💰 Giá trung bình 1 ly</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: P.pinkDark }}>{fmt(inp.gia)}đ</span>
              </div>
              <input type="range" min="15000" max="100000" step="1000"
                value={inp.gia} onChange={e => set('gia', +e.target.value)}
                style={{ width: '100%', accentColor: P.pink }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.textLight, marginTop: 4 }}>
                <span>15.000đ</span><span>100.000đ</span>
              </div>
            </div>
          </>}

          {/* STEP 1 — Khách & Nhân viên */}
          {step === 1 && <>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: P.textMid }}>👥 Lượng khách / ngày</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: P.pinkDark }}>{inp.khach} khách</span>
              </div>
              <input type="range" min="10" max="400" step="5"
                value={inp.khach} onChange={e => set('khach', +e.target.value)}
                style={{ width: '100%', accentColor: P.lav }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.textLight, marginTop: 4 }}>
                <span>10 khách</span><span>400 khách</span>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.textMid, marginBottom: 12 }}>
                👷 Số nhân viên &nbsp;<span style={{ color: P.pinkDark, fontWeight: 800 }}>{inp.nhanvien} người</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map(n => (
                  <div key={n} onClick={() => set('nhanvien', n)} style={{
                    width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${inp.nhanvien === n ? P.lav : '#F0DEE8'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, transition: 'all .15s',
                    background: inp.nhanvien === n ? P.lavBg : P.white,
                    color: inp.nhanvien === n ? P.lav : P.textMid,
                  }}>{n}</div>
                ))}
              </div>
            </div>
          </>}

          {/* STEP 2 — Tiện ích */}
          {step === 2 && [
            { key: 'choNgoi',  emoji: '🪑', label: 'Có chỗ ngồi',               sub: 'Tăng ~10% doanh thu', color: P.mint,  bg: P.mintBg },
            { key: 'delivery', emoji: '🛵', label: 'Có dịch vụ delivery',        sub: 'Tăng ~18% doanh thu', color: P.sky,   bg: P.skyBg  },
            { key: 'sinhvien', emoji: '📚', label: 'Cho sinh viên ngồi học lâu', sub: 'Giữ chân khách trung thành', color: P.lav, bg: P.lavBg },
          ].map(item => (
            <div key={item.key} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: inp[item.key] ? item.bg : '#F5EEF3',
                borderRadius: 14, width: 52, height: 52, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, transition: 'background .2s',
              }}>{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: P.text }}>{item.label}</div>
                <div style={{ fontSize: 11.5, color: inp[item.key] ? item.color : P.textLight, marginTop: 2, fontWeight: 600 }}>{item.sub}</div>
              </div>
              <Toggle value={inp[item.key]} onChange={v => set(item.key, v)} />
            </div>
          ))}

          {/* STEP 3 — Không gian */}
          {step === 3 && <>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: P.textMid }}>📐 Diện tích quán</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: P.pinkDark }}>{inp.dientich} m²</span>
              </div>
              <input type="range" min="10" max="200" step="5"
                value={inp.dientich} onChange={e => set('dientich', +e.target.value)}
                style={{ width: '100%', accentColor: P.peach }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: P.textLight, marginTop: 4 }}>
                <span>10 m²</span><span>200 m²</span>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.textMid, marginBottom: 12 }}>
                ⚔️ Số đối thủ trong 500m &nbsp;<span style={{ color: P.pinkDark, fontWeight: 800 }}>{inp.doithu} quán</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map(n => (
                  <div key={n} onClick={() => set('doithu', n)} style={{
                    width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${inp.doithu === n ? P.peach : '#F0DEE8'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, transition: 'all .15s',
                    background: inp.doithu === n ? P.peachBg : P.white,
                    color: inp.doithu === n ? '#B06020' : P.textMid,
                  }}>{n}</div>
                ))}
              </div>
            </div>
            {/* Summary */}
            <div style={{ ...card, background: P.pinkBg, border: `1.5px solid ${P.pink}55` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: P.pinkDark, marginBottom: 8 }}>📋 Tóm tắt thông tin</div>
              {[
                ['💰 Giá/ly', `${fmt(inp.gia)}đ`],
                ['👥 Khách/ngày', `${inp.khach} người`],
                ['📍 Vị trí', VITRI.find(v => v.key === inp.vitri)?.label],
                ['👷 Nhân viên', `${inp.nhanvien} người`],
                ['🛵 Delivery', inp.delivery ? 'Có' : 'Không'],
                ['📐 Diện tích', `${inp.dientich} m²`],
                ['⚔️ Đối thủ', `${inp.doithu} quán`],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3.5px 0', fontSize: 12.5, borderTop: i > 0 ? `1px solid ${P.pink}22` : 'none' }}>
                  <span style={{ color: P.textMid }}>{k}</span>
                  <span style={{ fontWeight: 700, color: P.text }}>{v}</span>
                </div>
              ))}
            </div>
          </>}
          <div style={{ height: 10 }} />
        </div>

        {/* Bottom button */}
        <div style={{ background: P.white, padding: '12px 14px 16px', borderTop: `1px solid ${P.pinkBg}` }}>
          <button onClick={goNext} style={{
            width: '100%', padding: '15px', background: P.pink, color: P.white,
            border: 'none', borderRadius: 22, fontSize: 16, fontWeight: 800, cursor: 'pointer',
          }}>
            {step < 3 ? 'Tiếp theo →' : '🔮 Dự đoán ngay!'}
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────
  if (screen === 2 && result) {
    const ok = result.loiNhuan >= 0;
    const vitriLabel = VITRI.find(v => v.key === inp.vitri)?.label;
    const tips = [
      !inp.delivery  && { e: '🛵', t: 'Thêm delivery có thể tăng ~18% doanh thu' },
      inp.doithu >= 5 && { e: '⚠️', t: 'Nhiều đối thủ — cần tạo điểm khác biệt' },
      !inp.choNgoi   && { e: '🪑', t: 'Thêm chỗ ngồi có thể tăng ~10%' },
      inp.gia < 25000 && { e: '💰', t: 'Giá còn thấp, tăng thêm 5–10k/ly cũng được' },
      !ok            && { e: '🚨', t: 'Đang lỗ — cần tăng giá hoặc giảm chi phí' },
      inp.doithu === 0 && { e: '✅', t: 'Khu vực ít cạnh tranh — lợi thế rất lớn!' },
      inp.sinhvien && inp.vitri === 'truong' && { e: '🎓', t: 'Gần trường + cho học lâu = khách trung thành' },
    ].filter(Boolean);

    return (
      <div style={{
        height: 620, background: P.bg, borderRadius: 32,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: P.pink, padding: '18px 16px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <button onClick={() => { setScreen(1); setStep(3); }} style={{
              background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 11,
              width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: P.white, fontWeight: 700,
            }}>←</button>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Kết quả dự đoán</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: P.white }}>☕ {vitriLabel}</div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 0' }}>

          {/* Score + range */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <ScoreRing score={result.score} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: P.textMid, marginBottom: 4 }}>Điểm tiềm năng</div>
              <div style={{ fontSize: 11, color: P.textMid, marginBottom: 2 }}>📅 Doanh thu / ngày</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: P.pinkDark, marginBottom: 8 }}>
                {fmtM(result.dtLow)} – {fmtM(result.dtHigh)}
              </div>
              <div style={{ fontSize: 11, color: P.textMid, marginBottom: 2 }}>📆 Doanh thu / tháng</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: P.pinkDark }}>{fmtM(result.dtThang)}</div>
            </div>
          </div>

          {/* Profit cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ ...card, textAlign: 'center', padding: '13px 8px', marginBottom: 0 }}>
              <div style={{ fontSize: 10, color: P.textMid }}>💸 Chi phí / tháng</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: P.peach, marginTop: 4 }}>{fmtM(result.chiPhi)}</div>
            </div>
            <div style={{ ...card, textAlign: 'center', padding: '13px 8px', marginBottom: 0, background: ok ? P.mintBg : '#FFF0F0' }}>
              <div style={{ fontSize: 10, color: P.textMid }}>📈 Lợi nhuận / tháng</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: ok ? P.mint : '#E05050', marginTop: 4 }}>
                {ok ? '' : '-'}{fmtM(Math.abs(result.loiNhuan))}
              </div>
              <div style={{ fontSize: 10, color: ok ? P.mint : '#E05050', marginTop: 2 }}>{ok ? '✅ Có lời' : '⚠️ Đang lỗ'}</div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.textMid, marginBottom: 10 }}>📊 Doanh thu / ngày (triệu VND)</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={result.bars} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.textMid }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: P.textLight }} axisLine={false} tickLine={false} />
                <Bar dataKey="val" radius={[8, 8, 0, 0]} label={{ position: 'top', fontSize: 11, fontWeight: 700, fill: P.textMid }}>
                  {result.bars.map((_, i) => <Cell key={i} fill={[P.sky, P.pink, P.mint][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost breakdown */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.textMid, marginBottom: 10 }}>💸 Phân tích chi phí / tháng</div>
            {[
              ['👷 Lương nhân viên', result.luongNV, P.lav],
              ['🏠 Thuê mặt bằng',   result.matBang, P.peach],
              ['🧋 Nguyên vật liệu', result.nvl,     P.pink],
            ].map(([label, val, color], i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: P.textMid }}>{label}</span>
                  <span style={{ fontWeight: 700, color: P.text }}>{fmtM(val)}</span>
                </div>
                <div style={{ height: 6, background: '#F0DEE8', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: color,
                    width: `${Math.min(100, Math.round(val / result.dtThang * 100))}%`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: P.textMid, marginBottom: 8 }}>💡 Gợi ý cải thiện</div>
              {tips.map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0', borderTop: i > 0 ? `1px solid ${P.pinkBg}` : 'none',
                }}>
                  <span style={{ fontSize: 19 }}>{tip.e}</span>
                  <span style={{ fontSize: 13, color: P.text, fontWeight: 500 }}>{tip.t}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ height: 10 }} />
        </div>

        {/* Bottom */}
        <div style={{ background: P.white, padding: '11px 14px 16px', borderTop: `1px solid ${P.pinkBg}` }}>
          <button onClick={() => { setScreen(0); setStep(0); }} style={{
            width: '100%', padding: '14px',
            background: P.pinkBg, color: P.pinkDark,
            border: `1.5px solid ${P.pink}`, borderRadius: 22,
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}>🔄 Dự đoán lại</button>
        </div>
      </div>
    );
  }
  return null;
}
