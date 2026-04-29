"use client";

/**
 * The Flow — hand-crafted SVG infographic of the Exora.ink pipeline.
 *
 * Six numbered stages flow left-to-right, each with an icon, headline,
 * and one-line summary. Two intake paths converge at the design stage,
 * two output paths diverge at the end (download vs hot folder).
 *
 * Sized 1280×720 for marketing/deck export. ResponsibleScale fits the
 * container width while preserving the aspect ratio.
 */
export function FlowInfographic() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <svg
        viewBox="0 0 1280 720"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full"
        role="img"
        aria-label="Exora.ink workflow infographic"
      >
        <defs>
          <linearGradient id="flowBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="tealCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="amberCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="skyCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="roseCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="emeraldCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
          </linearGradient>

          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>

          <filter id="glow">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Background */}
        <rect width="1280" height="720" fill="url(#flowBg)" />

        {/* Decorative glows */}
        <circle cx="200" cy="120" r="180" fill="#0D9488" opacity="0.06" filter="url(#glow)" />
        <circle cx="1080" cy="600" r="220" fill="#F59E0B" opacity="0.05" filter="url(#glow)" />
        <circle cx="640" cy="360" r="150" fill="#0EA5E9" opacity="0.04" filter="url(#glow)" />

        {/* Title */}
        <text x="640" y="56" fill="#5eead4" fontSize="14" fontWeight="700" letterSpacing="3" textAnchor="middle" fontFamily="system-ui">
          THE FLOW
        </text>
        <text x="640" y="92" fill="white" fontSize="32" fontWeight="700" textAnchor="middle" fontFamily="system-ui">
          Exora.ink — order to garment, end-to-end
        </text>

        {/* ============================================================ */}
        {/* Stage 1: INTAKE — split into two columns (website + custom) */}
        {/* ============================================================ */}
        <g transform="translate(60 150)">
          <text x="0" y="0" fill="#5eead4" fontSize="11" fontWeight="700" letterSpacing="2">01 · INTAKE</text>
          <rect x="0" y="14" width="190" height="86" rx="12" fill="url(#tealCard)" stroke="#0D9488" strokeOpacity="0.4" />
          <g transform="translate(16 30)">
            <circle r="14" fill="#0D9488" />
            {/* shopping cart glyph */}
            <path d="M-7 -3 L7 -3 L5 4 L-5 4 Z M-5 4 L-3 8 M5 4 L3 8 M-7 -3 L-9 -7" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="-3" cy="9" r="1.5" fill="white"/>
            <circle cx="3" cy="9" r="1.5" fill="white"/>
          </g>
          <text x="44" y="32" fill="white" fontSize="14" fontWeight="700">exora.ink</text>
          <text x="44" y="48" fill="#94a3b8" fontSize="11">Website orders</text>
          <text x="16" y="74" fill="#cbd5e1" fontSize="10">WooCommerce REST API</text>
          <text x="16" y="88" fill="#94a3b8" fontSize="10">→ Orders Dashboard</text>

          {/* OR divider */}
          <text x="220" y="60" fill="#64748b" fontSize="11" fontWeight="700">OR</text>

          <rect x="252" y="14" width="190" height="86" rx="12" fill="url(#skyCard)" stroke="#0EA5E9" strokeOpacity="0.4" />
          <g transform="translate(268 30)">
            <circle r="14" fill="#0EA5E9" />
            {/* phone glyph */}
            <path d="M-6 -7 L6 -7 L6 7 L-6 7 Z M-3 4 L3 4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          </g>
          <text x="296" y="32" fill="white" fontSize="14" fontWeight="700">Manual</text>
          <text x="296" y="48" fill="#94a3b8" fontSize="11">Phone · email · walk-in</text>
          <text x="268" y="74" fill="#cbd5e1" fontSize="10">Custom Orders dashboard</text>
          <text x="268" y="88" fill="#94a3b8" fontSize="10">→ C-NNNN auto numbering</text>
        </g>

        {/* Arrow from intake → design */}
        <path d="M 530 200 Q 580 200 600 200" stroke="#475569" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

        {/* ============================================================ */}
        {/* Stage 2: DESIGN PREP */}
        {/* ============================================================ */}
        <g transform="translate(620 150)">
          <text x="0" y="0" fill="#fbbf24" fontSize="11" fontWeight="700" letterSpacing="2">02 · DESIGN PREP</text>
          <rect x="0" y="14" width="280" height="86" rx="12" fill="url(#amberCard)" stroke="#F59E0B" strokeOpacity="0.4" />
          <g transform="translate(20 32)">
            <circle r="16" fill="#F59E0B" />
            {/* sparkles glyph */}
            <path d="M0 -10 L2 -3 L9 -1 L2 1 L0 8 L-2 1 L-9 -1 L-2 -3 Z" fill="white" />
          </g>
          <text x="50" y="34" fill="white" fontSize="14" fontWeight="700">Image Studio</text>
          <text x="50" y="50" fill="#94a3b8" fontSize="11">Nano Banana · Gemini</text>
          <text x="20" y="76" fill="#cbd5e1" fontSize="10">Preview ($0.04, 1K) → Production ($0.24, 4K)</text>
          <text x="20" y="90" fill="#94a3b8" fontSize="10">+ Prompt builder · history · refine with AI</text>
        </g>

        {/* Arrow design → bg-key */}
        <path d="M 920 200 Q 970 200 990 200" stroke="#475569" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

        {/* ============================================================ */}
        {/* Stage 3: BACKGROUND KEY-OUT */}
        {/* ============================================================ */}
        <g transform="translate(1010 150)">
          <text x="0" y="0" fill="#fb7185" fontSize="11" fontWeight="700" letterSpacing="2">03 · KEY OUT</text>
          <rect x="0" y="14" width="200" height="86" rx="12" fill="url(#roseCard)" stroke="#F43F5E" strokeOpacity="0.4" />
          <g transform="translate(20 32)">
            <circle r="16" fill="#F43F5E" />
            {/* eraser */}
            <rect x="-7" y="-4" width="12" height="8" rx="2" fill="white" transform="rotate(-20)"/>
            <line x1="-9" y1="6" x2="9" y2="6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          </g>
          <text x="50" y="34" fill="white" fontSize="14" fontWeight="700">Magenta out</text>
          <text x="50" y="50" fill="#94a3b8" fontSize="11">Server-side chroma key</text>
          <text x="20" y="76" fill="#cbd5e1" fontSize="10">#FF00FF → transparent</text>
          <text x="20" y="90" fill="#94a3b8" fontSize="10">No halo on dark garments</text>
        </g>

        {/* ============================================================ */}
        {/* Row 2: QC, RIP, PRESS, SHIP — wrap to next line */}
        {/* ============================================================ */}

        {/* Curved arrow from row 1 right edge down to row 2 left edge */}
        <path d="M 1110 250 Q 1230 280 1230 360 Q 1230 440 1110 440 L 200 440" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrow)" />

        {/* Stage 4: QC INSPECTION */}
        <g transform="translate(60 380)">
          <text x="0" y="0" fill="#7dd3fc" fontSize="11" fontWeight="700" letterSpacing="2">04 · QC + HALO INSPECTION</text>
          <rect x="0" y="14" width="240" height="100" rx="12" fill="url(#skyCard)" stroke="#0EA5E9" strokeOpacity="0.4" />
          <g transform="translate(20 38)">
            <circle r="16" fill="#0EA5E9" />
            {/* checkmark */}
            <path d="M-6 0 L-2 4 L7 -5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <text x="50" y="36" fill="white" fontSize="14" fontWeight="700">7-point QC</text>
          <text x="50" y="52" fill="#94a3b8" fontSize="11">DPI · transparency · edges · color · size</text>
          <text x="20" y="80" fill="#cbd5e1" fontSize="10">Effective DPI ≥ 300 @ print size</text>
          <text x="20" y="94" fill="#fbbf24" fontSize="10">⚠ Mandatory halo inspection checkbox</text>
        </g>

        {/* Arrow QC → upscale (conditional) */}
        <path d="M 320 430 Q 380 430 400 430" stroke="#475569" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

        {/* Stage 4b: UPSCALE (conditional) */}
        <g transform="translate(420 380)">
          <text x="0" y="0" fill="#5eead4" fontSize="11" fontWeight="700" letterSpacing="2">↑ IF DPI &lt; 300</text>
          <rect x="0" y="14" width="200" height="100" rx="12" fill="url(#tealCard)" stroke="#0D9488" strokeOpacity="0.4" strokeDasharray="3 3" />
          <g transform="translate(20 38)">
            <circle r="16" fill="#0D9488" />
            {/* upscale arrow */}
            <path d="M0 6 L0 -6 M-5 -1 L0 -6 L5 -1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <text x="50" y="36" fill="white" fontSize="14" fontWeight="700">Real-ESRGAN</text>
          <text x="50" y="52" fill="#94a3b8" fontSize="11">2× / 4× upscale via Replicate</text>
          <text x="20" y="80" fill="#cbd5e1" fontSize="10">$0.006–$0.012 per pass</text>
          <text x="20" y="94" fill="#94a3b8" fontSize="10">QC re-runs after upscale</text>
        </g>

        {/* Arrow upscale → ship/handoff */}
        <path d="M 640 430 Q 700 430 720 430" stroke="#475569" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

        {/* Stage 5: HANDOFF — Hot Folder */}
        <g transform="translate(740 380)">
          <text x="0" y="0" fill="#7dd3fc" fontSize="11" fontWeight="700" letterSpacing="2">05 · HANDOFF</text>
          <rect x="0" y="14" width="240" height="100" rx="12" fill="url(#skyCard)" stroke="#0EA5E9" strokeOpacity="0.4" />
          <g transform="translate(20 38)">
            <circle r="16" fill="#3B82F6" />
            {/* cloud */}
            <path d="M-7 0 C -10 0 -10 -6 -5 -6 C -5 -10 5 -10 5 -5 C 9 -5 9 2 5 2 L -7 2 Z" fill="white"/>
          </g>
          <text x="50" y="36" fill="white" fontSize="14" fontWeight="700">Hot Folder</text>
          <text x="50" y="52" fill="#94a3b8" fontSize="11">Dropbox /Apps/Exora-RIP/hot</text>
          <text x="20" y="80" fill="#cbd5e1" fontSize="10">Auto-uploaded from Image Studio</text>
          <text x="20" y="94" fill="#94a3b8" fontSize="10">RIP machine watches the folder</text>
        </g>

        {/* Arrow handoff → press */}
        <path d="M 1000 430 Q 1050 430 1070 430" stroke="#475569" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

        {/* Stage 6: PRESS */}
        <g transform="translate(1090 380)">
          <text x="0" y="0" fill="#6ee7b7" fontSize="11" fontWeight="700" letterSpacing="2">06 · PRESS</text>
          <rect x="0" y="14" width="170" height="100" rx="12" fill="url(#emeraldCard)" stroke="#10B981" strokeOpacity="0.4" />
          <g transform="translate(20 38)">
            <circle r="16" fill="#10B981" />
            {/* heat press */}
            <rect x="-8" y="2" width="16" height="3" fill="white" rx="1"/>
            <rect x="-7" y="-7" width="14" height="6" rx="1" fill="white"/>
            <line x1="0" y1="-7" x2="0" y2="-11" stroke="white" strokeWidth="1.6"/>
          </g>
          <text x="50" y="36" fill="white" fontSize="14" fontWeight="700">Heat press</text>
          <text x="50" y="52" fill="#94a3b8" fontSize="11">Hotronix Dual Air Fusion</text>
          <text x="20" y="80" fill="#cbd5e1" fontSize="10">DTF transfer onto garment</text>
          <text x="20" y="94" fill="#94a3b8" fontSize="10">300°F · 12s · firm pressure</text>
        </g>

        {/* ============================================================ */}
        {/* Final row: pricing tier annotation + finish */}
        {/* ============================================================ */}

        <g transform="translate(60 540)">
          <text x="0" y="0" fill="#5eead4" fontSize="11" fontWeight="700" letterSpacing="2">PRICING TIERS (PRESS SERVICE)</text>
          <rect x="0" y="14" width="540" height="120" rx="12" fill="#0F172A" stroke="#1e293b"/>

          {/* Three tier columns */}
          <g transform="translate(16 30)">
            <rect width="160" height="92" rx="8" fill="#0D948822" stroke="#0D9488" strokeOpacity="0.4"/>
            <text x="80" y="20" fill="#5eead4" fontSize="12" fontWeight="700" textAnchor="middle">TIER A · PREMIUM</text>
            <text x="80" y="40" fill="white" fontSize="20" fontWeight="700" textAnchor="middle">5–32%</text>
            <text x="80" y="56" fill="#94a3b8" fontSize="10" textAnchor="middle">below screen print</text>
            <text x="80" y="76" fill="#cbd5e1" fontSize="10" textAnchor="middle">Complex art · premium garment</text>
          </g>
          <g transform="translate(190 30)">
            <rect width="160" height="92" rx="8" fill="#0EA5E922" stroke="#0EA5E9" strokeOpacity="0.4"/>
            <text x="80" y="20" fill="#7dd3fc" fontSize="12" fontWeight="700" textAnchor="middle">TIER B · COMPETITIVE</text>
            <text x="80" y="40" fill="white" fontSize="20" fontWeight="700" textAnchor="middle">10–48%</text>
            <text x="80" y="56" fill="#94a3b8" fontSize="10" textAnchor="middle">below screen print</text>
            <text x="80" y="76" fill="#cbd5e1" fontSize="10" textAnchor="middle">Default · most jobs</text>
          </g>
          <g transform="translate(364 30)">
            <rect width="160" height="92" rx="8" fill="#F59E0B22" stroke="#F59E0B" strokeOpacity="0.4"/>
            <text x="80" y="20" fill="#fbbf24" fontSize="12" fontWeight="700" textAnchor="middle">TIER C · VOLUME</text>
            <text x="80" y="40" fill="white" fontSize="20" fontWeight="700" textAnchor="middle">15–58%</text>
            <text x="80" y="56" fill="#94a3b8" fontSize="10" textAnchor="middle">below screen print</text>
            <text x="80" y="76" fill="#cbd5e1" fontSize="10" textAnchor="middle">Volume · price-sensitive</text>
          </g>
        </g>

        {/* Hardware callout */}
        <g transform="translate(660 540)">
          <text x="0" y="0" fill="#7dd3fc" fontSize="11" fontWeight="700" letterSpacing="2">HARDWARE</text>
          <rect x="0" y="14" width="540" height="120" rx="12" fill="#0F172A" stroke="#1e293b"/>

          <g transform="translate(20 36)">
            <text x="0" y="0" fill="#fbbf24" fontSize="11" fontWeight="700">PRINTER</text>
            <text x="0" y="18" fill="white" fontSize="14" fontWeight="700">Mimaki TxF300-75</text>
            <text x="0" y="34" fill="#94a3b8" fontSize="11">30&quot; printable · 325 ft roll</text>
            <text x="0" y="52" fill="#5eead4" fontSize="11" fontWeight="600">36% more area/ft vs 22&quot;</text>
            <text x="0" y="68" fill="#94a3b8" fontSize="11">than competing transfer houses</text>
          </g>

          <line x1="270" y1="22" x2="270" y2="120" stroke="#1e293b"/>

          <g transform="translate(290 36)">
            <text x="0" y="0" fill="#fbbf24" fontSize="11" fontWeight="700">INK</text>
            <text x="0" y="18" fill="white" fontSize="14" fontWeight="700">Pigment + White</text>
            <text x="0" y="34" fill="#94a3b8" fontSize="11">$0.16/mL white · $0.133/mL color</text>
            <text x="0" y="52" fill="#5eead4" fontSize="11" fontWeight="600">Roll cost $264.49</text>
            <text x="0" y="68" fill="#94a3b8" fontSize="11">325 ft · paid-tier validated</text>
          </g>
        </g>

        {/* Footer */}
        <text x="640" y="700" fill="#475569" fontSize="11" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          exora.ink · veteran-owned · veteran-operated · San Diego
        </text>
      </svg>
    </div>
  );
}
