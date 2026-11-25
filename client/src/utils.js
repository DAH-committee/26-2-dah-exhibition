// 작품 이미지 경로: 목록은 560px 축소본, 상세는 원본
export const thumbOf = src => (src ? src.replace(/^\/works\//, '/works/thumb/') : '')
export const posterOf = work => work?.pages?.[0] ?? ''

// 같은 입력이면 같은 값을 내는 난수(별자리 배치를 화면마다 고정)
export function seeded(seedText) {
  let h = 2166136261
  for (let i = 0; i < seedText.length; i++) { h ^= seedText.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
