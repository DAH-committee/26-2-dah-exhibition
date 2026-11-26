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

// 덮개 구름: 화면 가운데(진행 방향)에서 바깥으로 퍼지며 커지는 구름 그림 수백 장.
// 판마다 깊이 z(1에서 0으로 줄어듦)를 갖고, 화면 위치와 크기를 z로 나눠 앞으로 날아 들어가는 느낌을 만든다.
export const overlayVertex = /* glsl */ `
attribute vec2 aDir;
attribute float aZ;
attribute float aAngle;
attribute float aAlpha;
attribute float aSize;
uniform vec2 uHalf;
uniform vec2 uCenter;
uniform float uRoll;
varying vec2 vUv;
varying float vAlpha;
void main() {
  vUv = uv;
  float z = max(aZ, 0.04);
  // 먼 판은 흐릿하게 나타나고, 아주 가까운 판은 사라진다(판 모서리가 화면을 가르지 않게)
  float fadeIn = smoothstep(1.0, 0.72, z);
  float fadeOut = smoothstep(0.06, 0.32, z);
  vAlpha = aAlpha * fadeIn * fadeOut;
  float ca = cos(aAngle), sa = sin(aAngle);
  vec2 p = position.xy * aSize / z;
  p = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);
  vec2 local = uCenter + aDir / z + p;
  float cr = cos(uRoll), sr = sin(uRoll);
  vec2 screen = vec2(local.x * cr - local.y * sr, local.x * sr + local.y * cr);
  gl_Position = vec4(screen.x / uHalf.x, screen.y / uHalf.y, 0.0, 1.0);
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
  // 구름 그림의 밝고 어두운 결을 살려 평평한 막처럼 보이지 않게 한다
  vec3 col = mix(uTint, vec3(1.0), 0.55) * (0.9 + 0.1 * tex.r);
  float a = smoothstep(0.0, 0.85, tex.a);
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
}
`

// 구름 속(화면 전체): SKY처럼 완전히 덮이는 순간을 만든다. 구름 결이 화면 가운데에서 바깥으로
// 계속 커지며 지나가(앞으로 날아 들어가는 느낌), 평평한 막이 아니라 구름 속처럼 보인다.
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
uniform float uTime;
uniform vec2 uHalf;
uniform float uRoll;
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
// 확대가 끝없이 이어지는 구름 결(두 층을 번갈아 키우며 섞음)
float zoomClouds(vec2 p, float t) {
  float k = fract(t);
  float s1 = exp2(k), s2 = exp2(k - 1.0);
  float a = fbm(p / s1 * 2.2 + 3.1);
  float b = fbm(p / s2 * 2.2 + 9.7);
  return mix(a, b, smoothstep(0.0, 1.0, k));
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uHalf.x / uHalf.y, 1.0);
  float cr = cos(uRoll), sr = sin(uRoll);
  p = vec2(p.x * cr - p.y * sr, p.x * sr + p.y * cr);
  float n = zoomClouds(p, uTime * 0.55);
  float n2 = zoomClouds(p * 0.6 + 4.0, uTime * 0.35 + 0.5);
  float shade = 0.78 + 0.22 * smoothstep(0.25, 0.8, n * 0.65 + n2 * 0.35);
  vec3 base = mix(uTint, vec3(1.0), 0.62);
  vec3 col = base * shade;
  // 덮개가 반쯤 올라왔을 때부터 차오르고, 다 올라오면 빈틈 없이 덮는다
  float a = smoothstep(0.35, 1.0, uOpacity);
  gl_FragColor = vec4(col, a);
}
`
