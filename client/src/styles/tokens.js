// src/styles/tokens.js: 26-2 전시 사이트 디자인 토큰 (단일 출처)
// 색은 포스터 "One Star per House"에서 뽑았다. tailwind.config.js와 index.css가 이 값을 쓴다.

export const color = {
  ink: '#0e1b24',          // 해 질 녘 장면 위 글자
  inkSoft: '#2b3a44',      // 보조 글자(밝은 유리 위 대비 9:1 이상)
  paper: '#fbf7f2',        // 밤 장면 위 글자
  paperSoft: '#d9e0ee',    // 밤 장면 보조 글자
  teal: '#2f6f86',         // 포스터 하늘 위쪽
  peach: '#f2c9b8',        // 포스터 구름
  cream: '#f4e6d6',        // 포스터 벽
  gold: '#f5c84c',         // 별
  night: '#0b1630',        // 밤하늘
  glassLight: 'rgba(251, 247, 242, 0.34)',
  glassLightStrong: 'rgba(251, 247, 242, 0.62)',
  glassDark: 'rgba(12, 22, 48, 0.46)',
  glassDarkStrong: 'rgba(12, 22, 48, 0.72)',
}

export const font = {
  sans: ['Jost', 'Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
  body: ['Pretendard Variable', 'Pretendard', 'Jost', 'system-ui', 'sans-serif'],
  serif: ['Libre Caslon Text', 'Noto Serif KR', 'serif'],
  serifKo: ['Noto Serif KR', 'Libre Caslon Text', 'serif'],
}

// 글자 역할. 크기는 1440 폭 값과 390 폭 값 사이를 clamp로 잇는다(보고서 5-2 비율).
export const type = {
  display: { fontFamily: font.sans, fontWeight: 300, fontSize: 'clamp(44px, 8.9vw, 128px)', lineHeight: '1', letterSpacing: '-0.01em', textTransform: 'uppercase' },
  word: { fontFamily: font.sans, fontWeight: 500, fontSize: 'clamp(52px, 8.9vw, 128px)', lineHeight: '1', letterSpacing: '0.02em', textTransform: 'uppercase' },
  pageTitle: { fontFamily: font.sans, fontWeight: 300, fontSize: 'clamp(40px, 6.2vw, 96px)', lineHeight: '1', letterSpacing: '-0.01em', textTransform: 'uppercase' },
  caseTitle: { fontFamily: font.sans, fontWeight: 500, fontSize: 'clamp(30px, 4.6vw, 72px)', lineHeight: '1.2', letterSpacing: '-0.02em' },
  date: { fontFamily: font.sans, fontWeight: 300, fontSize: 'clamp(28px, 3.4vw, 48px)', lineHeight: '1', letterSpacing: '0' },
  lead: { fontFamily: font.body, fontWeight: 300, fontSize: 'clamp(22px, 2.5vw, 34px)', lineHeight: '1.55', letterSpacing: '-0.02em' },
  serifLine: { fontFamily: font.serifKo, fontWeight: 400, fontSize: 'clamp(18px, 1.67vw, 24px)', lineHeight: '1.7', letterSpacing: '-0.01em' },
  serifTitle: { fontFamily: font.serif, fontWeight: 400, fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: '1.15', letterSpacing: '-0.01em' },
  subtitle: { fontFamily: font.body, fontWeight: 500, fontSize: 'clamp(15px, 1.4vw, 20px)', lineHeight: '1.5', letterSpacing: '-0.01em' },
  heading: { fontFamily: font.body, fontWeight: 600, fontSize: 'clamp(17px, 1.4vw, 20px)', lineHeight: '1.45', letterSpacing: '-0.01em' },
  body: { fontFamily: font.body, fontWeight: 400, fontSize: 'clamp(15px, 1.2vw, 18px)', lineHeight: '1.75', letterSpacing: '-0.01em' },
  small: { fontFamily: font.body, fontWeight: 400, fontSize: '14px', lineHeight: '1.6', letterSpacing: '-0.005em' },
  nav: { fontFamily: font.sans, fontWeight: 500, fontSize: 'clamp(14px, 1.12vw, 16px)', lineHeight: '1.5', letterSpacing: '0.1em', textTransform: 'uppercase' },
  label: { fontFamily: font.sans, fontWeight: 500, fontSize: '12px', lineHeight: '1.35', letterSpacing: '0.1em', textTransform: 'uppercase' },
  num: { fontFamily: font.sans, fontWeight: 400, fontSize: '14px', lineHeight: '1.5', letterSpacing: '0.02em' },
}

export const space = { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px', 8: '64px', 9: '96px', 10: '128px' }

export const layout = {
  pageX: 'clamp(20px, 5.56vw, 96px)', // 로고, 본문, 바닥 줄 왼쪽 끝을 같은 값으로 맞춘다
  topBar: '88px',
  maxText: '680px',
}

export const radius = { DEFAULT: '4px' } // 반경 단계 하나

// 높이 단계 그림자: 0 바닥, 1 카드, 2 떠 있는 판, 3 손을 올린 카드
export const shadow = {
  0: 'none',
  1: '0 1px 2px rgba(8, 18, 40, 0.10), 0 6px 18px rgba(8, 18, 40, 0.10)',
  2: '0 2px 4px rgba(8, 18, 40, 0.12), 0 20px 50px rgba(8, 18, 40, 0.20)',
  3: '0 4px 10px rgba(8, 18, 40, 0.16), 0 30px 70px rgba(8, 18, 40, 0.26)',
}

export const motion = {
  ease: 'cubic-bezier(0.45, 0, 0.55, 1)',
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  fast: '200ms',
  base: '400ms',
  slow: '750ms',
  transition: 5, // 장면 전환 초
}

export const z = { canvas: 0, page: 10, chrome: 30, word: 40, menu: 50, lightbox: 60 }
