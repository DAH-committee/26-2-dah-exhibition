// 구름 판과 전환 덮개 셰이더 (우리 코드)
// 기법: 구름 그림 한 장을 붙인 평면을 여러 장 겹치고, 카메라 바로 앞 판은 깊이값으로 투명하게,
// 거리에 따라 먼 쪽 색과 가까운 쪽 색으로 어둡게 누르며(채널별 최소값), 먼 판은 사라지게 한다.

export const cloudVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const cloudFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uAngle;
uniform float uCamZ;
uniform float uFade;
uniform float uBlend;
uniform vec3 uFar;
uniform vec3 uNear;
uniform vec3 uShade;
varying vec2 vUv;
varying vec3 vWorld;

vec3 pressToward(vec3 base, vec3 tint, float amount) {
  return mix(base, min(base, tint), clamp(amount, 0.0, 1.0));
}

void main() {
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 uv = mat2(c, s, -s, c) * (vUv - 0.5) + 0.5;
  vec4 tex = texture2D(uMap, uv);

  // 카메라에 붙은 판은 깊이값 20제곱으로 지워 판 모서리가 보이지 않게 한다
  float alpha = tex.a * pow(gl_FragCoord.z, 20.0);

  float dist = uCamZ - vWorld.z;
  vec3 col = tex.rgb * uShade;
  col = pressToward(col, uFar, dist / uFade * uBlend);
  // 가까운 쪽 색은 카메라와의 거리로 누른다(카메라가 어디로 날아가도 같은 색)
  col = pressToward(col, uNear, (vWorld.z - uCamZ + 7000.0) / uFade * uBlend);

  alpha *= uOpacity * clamp((uFade - dist) / (uFade * 0.5), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`

// 하늘 판: 낮 그림과 밤 그림을 섞는다. 판은 가운데 1x1 영역만 그림 한 장이고 바깥은 가장자리 색을 늘려 쓴다.
// uShiftU 만큼 그림을 좌우로 밀어, 카메라가 돌 때 아주 먼 하늘이 지나가는 것처럼 보이게 한다.
export const backdropVertex = /* glsl */ `
uniform float uExt;
varying vec2 vUv;
void main() {
  vUv = (uv - 0.5) * vec2(uExt, uExt) + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const backdropFragment = /* glsl */ `
uniform sampler2D uDusk;
uniform sampler2D uNight;
uniform float uMix;
uniform float uShiftU;
uniform float uNightV;
varying vec2 vUv;
void main() {
  vec2 uv = vec2(vUv.x + uShiftU, vUv.y);
  // 좌우는 거울처럼 되풀이해 이음매 없이 이어지게, 위아래는 가장자리 색을 늘린다
  float u = abs(mod(uv.x, 2.0) - 1.0);
  u = 1.0 - u;
  vec2 a = vec2(u, clamp(uv.y, 0.002, 0.998));
  vec2 b = vec2(u, clamp(uv.y - uNightV, 0.002, 0.998));
  vec3 dusk = texture2D(uDusk, a).rgb;
  vec3 night = texture2D(uNight, b).rgb;
  gl_FragColor = vec4(mix(dusk, night, clamp(uMix, 0.0, 1.0)), 1.0);
}
`

// 덮개 구름 판: 화면 좌표(왼쪽 위 0,0, 아래로 +y)에서 판 위치 aPos, 자전 aAngle, 크기 aSize.
// 덮개 전체를 화면 가운데를 축으로 uRot만큼 돌려(진행 방향 각도 + 카메라 기울기) 구름이 한 방향으로 흐르게 한다.
export const overlayVertex = /* glsl */ `
attribute vec2 aPos;
attribute float aAngle;
attribute float aSize;
attribute float aAlpha;
uniform vec2 uSize;
uniform float uRot;
varying vec2 vUv;
varying float vAlpha;
void main() {
  vUv = uv;
  vAlpha = aAlpha;
  float ca = cos(aAngle), sa = sin(aAngle);
  vec2 q = position.xy * aSize;
  q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
  vec2 p = aPos + vec2(q.x, -q.y);
  vec2 c = uSize * 0.5;
  float cr = cos(uRot), sr = sin(uRot);
  vec2 d = p - c;
  vec2 s = c + vec2(d.x * cr - d.y * sr, d.x * sr + d.y * cr);
  gl_Position = vec4(s.x / uSize.x * 2.0 - 1.0, 1.0 - s.y / uSize.y * 2.0, 0.0, 1.0);
}
`

export const overlayFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uTint;
uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
void main() {
  vec4 tex = texture2D(uMap, vUv);
  // 원본: 흰 구름 그림에 밝기 0.9, 장면 색을 살짝 입힘. 그림의 밝고 어두운 결은 살린다
  vec3 col = mix(uTint, vec3(1.0), 0.6) * (0.66 + 0.34 * smoothstep(0.35, 1.0, tex.r));
  gl_FragColor = vec4(col, tex.a * vAlpha * uOpacity);
}
`

// 구름 속(화면 전체): SKY처럼 완전히 덮이는 순간을 만든다. 구름 결이 덮개 구름과 같은 방향, 같은 속도로
// 흘러 지나가(앞으로 날아가는 느낌) 평평한 막이 아니라 구름 속처럼 보인다.
export const fillVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const fillFragment = /* glsl */ `
uniform vec3 uTint;
uniform float uOpacity;
uniform vec2 uSize;
uniform float uRot;
uniform float uScroll;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}
void main() {
  // 화면 좌표(아래로 +y)로 바꾸고 덮개와 같은 각도만큼 되돌려, 흐름 방향을 덮개 구름과 맞춘다
  vec2 s = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  vec2 c = uSize * 0.5;
  float cr = cos(-uRot), sr = sin(-uRot);
  vec2 d = s - c;
  vec2 p = vec2(d.x * cr - d.y * sr, d.x * sr + d.y * cr);
  p.y -= uScroll;
  float n = fbm(p / 260.0);
  float n2 = fbm(p / 700.0 + 7.0);
  float shade = 0.7 + 0.3 * smoothstep(0.3, 0.75, n * 0.55 + n2 * 0.45);
  vec3 col = mix(uTint, vec3(1.0), 0.5) * shade;
  float a = smoothstep(0.45, 1.0, uOpacity);
  gl_FragColor = vec4(col, a);
}
`
