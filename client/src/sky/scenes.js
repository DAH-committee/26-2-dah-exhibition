import { SKY_THEME } from './theme'

// 장면 설정. 층 수치는 역설계 보고서 2-4절, 카메라는 3-2절 값을 옮겼고 색은 포스터에서 뽑았다.
// 모든 장면은 같은 구름 들판 하나를 공유한다. 장면을 바꿀 때 구름을 다시 만들지 않고
// 카메라 자리와 방향, 색만 한 번의 비행으로 이어서 바꾼다(끊김과 되돌림 없음).

// 아래층과 위층(천장) 구름
export const FIELD = [
  { start: -8000, end: 8000, width: 14000, density: 0.02, speed: 6, w: 1100, h: 1000, y: -600, fade: 15000, curve: 3000, scale: 0.000058 },
  { start: -4000, end: 6000, width: 20000, density: 0.035, speed: 3, w: 3000, h: 2000, y: 2500, fade: 12000, curve: 10000, invert: true, scale: 0, opacity: SKY_THEME === 'poster' ? 0.24 : 0.45 }, // 새 색은 포스터처럼 맑은 청록 하늘이 보이게 천장 구름을 옅게
]
// 구름 판이 바라보는 기준점(보고서: 생성 때 카메라 출발점을 lookAt)
export const FIELD_EYE = [0, 600, 7000]

// 색 묶음. far = 먼 쪽 구름을 누르는 색, near = 가까운 쪽, shade = 구름 그림에 곱하는 색
const PALETTE_SETS = {
  // 처음 만든 노을 색
  v1: {
    dusk: { far: '#f4a48e', near: '#5f9fb6', shade: '#fff8f4', blend: 1.0, bg: '#7fa3b3', overlay: '#f6cfc0', topFar: '#cfe6ee', topNear: '#8cc4d6', topBlend: 1.2 },
    dusk2: { far: '#f6b09a', near: '#6aa8bd', shade: '#fffaf6', blend: 0.9, bg: '#86a9b8', overlay: '#f7d9cc', topFar: '#d6eaf0', topNear: '#94c8d8', topBlend: 1.1 },
    night: { far: '#4f68b4', near: '#24387a', shade: '#93a8dc', blend: 0.95, bg: '#0b1630', overlay: '#7186c4', topFar: '#33498e', topNear: '#1f3170', topBlend: 1.0 },
  },
  // 포스터 색: 청록 하늘(#3d84a6 근처)과 분홍 구름(#f4b6a8 근처), 밤은 라벤더와 분홍이 도는 남색
  poster: {
    dusk: { far: '#dfaea2', near: '#3a7f9c', shade: '#fbefea', blend: 1.0, bg: '#4a8aa6', overlay: '#e9cbc2', topFar: '#6ea9c1', topNear: '#2a6e8b', topBlend: 1.8 },
    dusk2: { far: '#e4b6aa', near: '#4288a5', shade: '#fcf2ee', blend: 0.95, bg: '#5292ad', overlay: '#ecd2ca', topFar: '#7ab1c7', topNear: '#337894', topBlend: 1.7 },
    night: { far: '#5763b6', near: '#1f2c6e', shade: '#9ba4dc', blend: 0.95, bg: '#0b1534', overlay: '#8e8fcf', topFar: '#323f8e', topNear: '#1c2968', topBlend: 1.0 },
  },
}
export const PALETTES = PALETTE_SETS[SKY_THEME]

const mobileTilt = () => (typeof window !== 'undefined' && window.innerWidth <= 767 ? -0.1 : 0)
const aspectFix = () => (typeof window !== 'undefined' ? 16 / 9 - window.innerWidth / window.innerHeight : 0)

export const SCENES = {
  intro: {
    sky: 'dusk', palette: 'dusk', skyDist: 15000,
    cam: () => ({ pos: [-100, 200, 7500], rot: [0.02 + aspectFix() * 0.05, 0, 0] }),
    houses: true, introFactor: 1, word: 'DUSK',
  },
  home: {
    sky: 'dusk', palette: 'dusk', skyDist: 15000,
    cam: () => ({ pos: [0, 600, 7000], rot: [mobileTilt(), 0, 0] }),
    introFactor: 1, word: 'DUSK',
  },
  works: {
    sky: 'night', palette: 'night', skyDist: 9000,
    cam: () => ({ pos: [-2000, 300, 8000], rot: [0, 0.3, 0] }), // 왼쪽으로 날아와 왼쪽을 바라봄
    introFactor: 2, word: 'NIGHT', stars: true,
  },
  about: {
    sky: 'dusk', palette: 'dusk2', skyDist: 12000,
    cam: () => ({ pos: [0, 500, 6000], rot: [0.02, 0, 0] }),
    introFactor: 2, word: 'ONE STAR',
  },
  awards: {
    sky: 'dusk', palette: 'dusk', skyDist: 9000, flipX: true,
    cam: () => ({ pos: [2000, 300, 8000], rot: [0, -0.3, 0] }), // 오른쪽으로 날아와 오른쪽을 바라봄
    introFactor: 2, word: 'SHINE',
  },
  visit: {
    sky: 'dusk', palette: 'dusk2', skyDist: 15000,
    cam: () => ({ pos: [1000, 200, 5000], rot: [-0.06 - aspectFix() * 0.05, 0.2 + aspectFix() * 0.14, 0] }),
    introFactor: 2, word: 'ROOFTOP',
  },
  contest: {
    sky: 'dusk', palette: 'dusk', skyDist: 9000,
    cam: () => ({ pos: [2500, 400, 7500], rot: [0.03, -0.45, 0] }),
    introFactor: 2, word: 'POSTER',
  },
  lucid: {
    sky: 'dusk', palette: 'dusk2', skyDist: 9000, flipX: true,
    cam: () => ({ pos: [-2500, 400, 7500], rot: [0.03, 0.45, 0] }),
    introFactor: 2, word: 'LUCID',
  },
}

// 홈을 가운데 둔 나침반 자리. 두 장면 자리의 차이로 날아갈 방향을 정한다.
const COMPASS = {
  intro: [0, -1], home: [0, 0], about: [0, 1], visit: [0, -1], works: [-1, 0], awards: [1, 0],
  contest: [1, 1], lucid: [-1, 1],
}
const DIR_NAMES = {
  '0,1': 'Up', '1,1': 'UpRight', '1,0': 'Right', '1,-1': 'RightDown',
  '0,-1': 'Down', '-1,-1': 'DownLeft', '-1,0': 'Left', '-1,1': 'LeftUp',
}
export function directionBetween(from, to) {
  if (from === to) return 'None'
  if (from === 'intro' && to === 'home') return 'Up'
  const a = COMPASS[from] ?? [0, 0]
  const b = COMPASS[to] ?? [0, 0]
  const dx = Math.sign(b[0] - a[0])
  const dy = Math.sign(b[1] - a[1])
  return DIR_NAMES[`${dx},${dy}`] ?? 'Up'
}

// 보고서 3-5절 방향표(기준값 0.7)
export function movementFor(dir) {
  const t = 0.7
  const e = { x: 0, y: 0, z: 0, forward: 1500 }
  switch (dir) {
    case 'Up': e.x = t; break
    case 'UpRight': e.x = t; e.y = -t; e.z = -(t * 0.25); break
    case 'Right': e.y = -(t * 2); e.z = -(t * 0.37); break
    case 'RightDown': e.x = -t; e.y = -t; e.z = -(t * 0.25); break
    case 'Down': e.x = -t; break
    case 'SlightDown': e.x = -t * 0.3; break
    case 'DownLeft': e.x = -t; e.y = t; e.z = t * 0.25; break
    case 'Left': e.y = t; e.z = t * 0.37; break
    case 'LeftUp': e.x = t; e.y = t; e.z = t * 0.25; break
    default: e.forward = 0
  }
  return e
}

export const DIR_DEGREES = { Up: 0, UpRight: 25, Right: 90, RightDown: 155, Down: 180, SlightDown: 180, DownLeft: 205, Left: 270, LeftUp: 335 }

export function sceneForPath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/') return 'home'
  if (p === '/intro') return 'intro'
  if (p === '/works' || p.startsWith('/works/')) return 'works'
  if (p === '/about') return 'about'
  if (p === '/awards') return 'awards'
  if (p === '/visit') return 'visit'
  if (p === '/contest') return 'contest'
  if (p === '/lucid') return 'lucid'
  return 'home'
}
