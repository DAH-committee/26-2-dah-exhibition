// 26-2 전시 기본 정보(포스터와 운영위원회 확정 내용)
export const EXHIBITION = {
  ordinal: 19,
  title: '제19회 디지털인문예술전공 프로젝트 전시회',
  period: '2026. 12. 1 (화) ~ 12. 3 (목)',
  periodParts: ['2026. 12. 1 (화)', '~ 12. 3 (목)'],
  venue: '한림대학교 일송기념도서관 C.Square',
  address: '강원특별자치도 춘천시 한림대학길 1, 한림대학교 일송기념도서관',
  partners: ['HUSS X 디지털인문예술', 'SW중심대학사업단', '디지털인문학연구소'],
  // 전시 최종 포스터(인쇄본과 같은 그림, PNG 긴 변 2400px)
  finalPoster: { src: '/about/poster-26-2.png', width: 1697, height: 2400 },
  poster: {
    src: '/about/poster-one-star-per-house.jpg',
    title: 'One Star per House',
    award: '2026-2 전시회 포스터 공모전 최우수상',
    author: '주현호',
  },
}

// 포스터 공모전 출품 때 낸 작품 설명 원문(BEYOND THE KNOWN 사이트 "1. 작품 설명", 2026. 11. 26. 확인). 고치지 않는다
export const POSTER_STORY = [
  '분홍 구름이 낀 해 질 무렵, 동네 사람들이 옥상과 벽 사다리에 올라 있다. 물탱크 옆 옥상에 선 사람은 하늘을 올려다보고, 아랫집 벽에서는 다른 사람이 사다리를 오른다. 제목 옆 하늘에는 실에 매단 작은 별 하나가 걸려 있다. 포스터 속 동네에서는 해가 지기 전에 집마다 한 사람씩 올라가 별 하나를 단다. 밤이 되면 동네가 단 별과 다른 나라 동네들이 단 별이 함께 빛나고, 별들이 모여 하늘의 별자리 하나를 이룬다.',
]
