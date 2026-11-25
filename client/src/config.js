// src/config.js — 환경 변수와 사이트 이름
// 컨셉(전시 제목)이 정해지면 CONCEPT_TITLE만 바꾸면 된다.

export const API_BASE = (import.meta.env.VITE_API_BASE || 'https://dah-hallym.vercel.app/api').replace(/\/+$/, '')
export const SEMESTER = import.meta.env.VITE_SEMESTER || '2026-2'
// static(기본): src/data/static/exhibition.json 과 /works/*.webp 만 쓴다. 서버 호출과 주기 갱신 없음.
// demo: 26-1 작품 데이터, api: VITE_API_BASE 서버
const RAW_SOURCE = import.meta.env.VITE_DATA_SOURCE
export const DATA_SOURCE = RAW_SOURCE === 'demo' || RAW_SOURCE === 'api' ? RAW_SOURCE : 'static'
export const IS_DEMO = DATA_SOURCE === 'demo'
export const IS_STATIC = DATA_SOURCE === 'static'

// '2026-2' -> '26-2'
export const SEMESTER_LABEL = SEMESTER.replace(/^20(\d{2})-(\d)$/, '$1-$2')

export const SITE_NAME = `${IS_DEMO ? '26-1' : SEMESTER_LABEL} DAH EXHIBITION`
export const CONCEPT_TITLE = 'One Star per House'

export function pageTitle(page) {
  const base = `${SITE_NAME}: ${CONCEPT_TITLE}`
  return page ? `${page} | ${base}` : base
}
