import { useEffect, useMemo, useRef, useState } from 'react'
import { useSky } from '../../sky/SkyProvider'
import { seeded } from '../../utils'

// 별자리 보기: 작품 하나가 별 하나, 같은 과목 별을 선으로 잇는다. 별을 누르면 작품 상세.
const STAR_PATH = (cx, cy, r) => {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.42
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

function layoutClusters(groups, W, H, cols) {
  const rows = Math.ceil(groups.length / cols)
  const cw = W / cols
  const ch = H / rows
  return groups.map((g, i) => {
    const rnd = seeded(g.subject.id)
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = cw * (col + 0.5) + (rnd() - 0.5) * cw * 0.22
    const cy = ch * (row + 0.5) + (rnd() - 0.5) * ch * 0.18
    const radius = Math.min(cw, ch) * (0.22 + Math.min(g.works.length, 11) * 0.018)
    const stars = []
    g.works.forEach(w => {
      let best = null
      for (let tries = 0; tries < 40; tries++) {
        const a = rnd() * Math.PI * 2
        const r = Math.sqrt(rnd()) * radius
        const p = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8 }
        const minD = stars.reduce((m, s) => Math.min(m, Math.hypot(s.x - p.x, s.y - p.y)), Infinity)
        if (!best || minD > best.d) best = { ...p, d: minD }
        if (minD > radius * 0.42) break
      }
      stars.push({ x: best.x, y: best.y, work: w })
    })
    // 가장 왼쪽 별에서 시작해 가까운 별로 이어 가는 선
    const left = [...stars].sort((a, b) => a.x - b.x)
    const chain = left.length ? [left.shift()] : []
    while (left.length) {
      const last = chain[chain.length - 1]
      left.sort((a, b) => Math.hypot(a.x - last.x, a.y - last.y) - Math.hypot(b.x - last.x, b.y - last.y))
      chain.push(left.shift())
    }
    const labelY = Math.max(...stars.map(s => s.y), cy) + 34
    return { ...g, cx, cy, stars, chain, labelY }
  })
}

export default function Constellation({ groups }) {
  const { flyTo } = useSky()
  const wrap = useRef(null)
  const [size, setSize] = useState({ w: 1440, h: 760 })
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cols = size.w < 640 ? 2 : size.w < 1024 ? 3 : 5
  const clusters = useMemo(() => layoutClusters(groups, size.w, size.h, cols), [groups, size.w, size.h, cols])
  const starR = size.w < 640 ? 7 : 9

  return (
    <div ref={wrap} className="relative w-full" style={{ height: size.w < 640 ? `${Math.ceil(groups.length / 2) * 230}px` : size.w < 1024 ? '1150px' : 'max(620px, calc(100svh - 260px))' }}>
      <svg width={size.w} height={size.h} className="absolute inset-0 overflow-visible" role="list" aria-label="과목별 별자리">
        {clusters.map(c => (
          <g key={c.subject.id} role="listitem" aria-label={`${c.subject.name} ${c.works.length}개 작품`}>
            <polyline
              points={c.chain.map(s => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke="rgba(245, 200, 76, 0.42)"
              strokeWidth="1"
            />
            {c.stars.map(s => {
              const on = hover?.work.id === s.work.id
              return (
                <a
                  key={s.work.id}
                  href={`/works/${s.work.id}`}
                  aria-label={`${s.work.title}, ${s.work.author}`}
                  onClick={e => { e.preventDefault(); flyTo(`/works/${s.work.id}`) }}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(h => (h === s ? null : h))}
                  onFocus={() => setHover(s)}
                  onBlur={() => setHover(null)}
                >
                  <circle cx={s.x} cy={s.y} r={starR * 2.4} fill="transparent" />
                  <path
                    d={STAR_PATH(s.x, s.y, starR)}
                    fill="#f5c84c"
                    style={{
                      transformOrigin: `${s.x}px ${s.y}px`,
                      transform: on ? 'scale(1.6)' : 'scale(1)',
                      transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                      filter: 'drop-shadow(0 0 6px rgba(245, 200, 76, 0.75))',
                    }}
                  />
                </a>
              )
            })}
            <text x={c.cx} y={c.labelY} textAnchor="middle" className="fill-[#d9e0ee]" style={{ font: '500 13px/1.4 Pretendard Variable, Pretendard, sans-serif', letterSpacing: '-0.01em' }}>
              {c.subject.name}
            </text>
          </g>
        ))}
      </svg>
      {hover && (
        <div
          className="glass glass-strong pointer-events-none absolute z-10 w-[min(280px,70vw)] p-s3 shadow-e2"
          style={{
            left: Math.min(Math.max(hover.x - 140, 0), size.w - 280),
            top: hover.y + 20,
          }}
        >
          <p className="t-heading fg lines-2">{hover.work.title}</p>
          <p className="t-small fg-soft lines-1">{hover.work.author}</p>
        </div>
      )}
    </div>
  )
}
