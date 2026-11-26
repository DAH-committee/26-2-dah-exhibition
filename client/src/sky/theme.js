// 하늘 색 묶음 선택. 기본은 포스터 색(청록 하늘과 분홍 구름, 옅은 분홍 드림코어 밤).
// 주소 뒤에 ?sky=v1 을 붙이면 처음 만든 노을 색(주황 수평선, 남색 밤)을 그대로 볼 수 있다.
// 처음 들어올 때 한 번만 읽고, 사이트 안에서 페이지를 옮겨도 같은 묶음을 유지한다.
const param = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sky') : null
export const SKY_THEME = param === 'v1' ? 'v1' : 'poster'

export const SKY_TEXTURES = {
  v1: { dusk: '/sky/dusk.webp', night: '/sky/night-hd.webp' },
  poster: { dusk: '/sky/dusk-poster.webp', night: '/sky/night-dream.webp' },
}[SKY_THEME]
