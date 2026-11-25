import * as THREE from 'three'
import { cloudVertex, cloudFragment } from './shaders'

const rand = (a, b) => a + Math.random() * (b - a)
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

// 구름 판 한 층. start부터 end까지 z 간격 floor(1/density)마다 판 한 장을 두고,
// 매 프레임 z += 0.7 x speed 로 카메라 쪽으로 밀어 end를 넘으면 start로 돌려보낸다.
export class CloudLayer {
  constructor({ scene, eye, texture, cfg, shared, densityScale = 1, motion = 1, speed = { mul: 1 } }) {
    this.scene = scene
    this.eye = eye
    this.speedRef = speed
    this.cfg = cfg
    this.motion = motion
    this.clouds = []
    this.geometry = new THREE.PlaneGeometry(cfg.w, cfg.h)

    const base = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: cfg.opacity ?? 1 },
        uAngle: { value: 0 },
        uCamZ: shared.uCamZ,
        uFade: { value: cfg.fade },
        uBlend: shared.uBlend,
        uFar: shared.uFar,
        uNear: shared.uNear,
        uShade: shared.uShade,
      },
      vertexShader: cloudVertex,
      fragmentShader: cloudFragment,
      transparent: true,
      depthWrite: false,
    })
    this.base = base

    const step = Math.max(1, Math.floor(1 / (cfg.density * densityScale)))
    for (let z = cfg.start; z < cfg.end; z++) {
      if (z % step === 0) this.spawn(z)
    }
  }

  spawn(z) {
    const { cfg } = this
    const mat = this.base.clone()
    // 공유 uniform은 같은 객체를 가리키게 해서 색 전환을 한 번에 반영한다
    for (const k of ['uCamZ', 'uBlend', 'uFar', 'uNear', 'uShade', 'uMap']) mat.uniforms[k] = this.base.uniforms[k]
    mat.uniforms.uAngle = { value: Math.random() * Math.PI }
    mat.uniforms.uOpacity = { value: cfg.opacity ?? 1 }
    mat.uniforms.uFade = { value: cfg.fade }

    const m = new THREE.Mesh(this.geometry, mat)
    m.matrixAutoUpdate = true
    m.frustumCulled = false
    m.position.x = rand(-cfg.width / 2, cfg.width / 2)
    const g = Math.abs(m.position.x / cfg.width) * (cfg.curve || 0)
    let lo = -400
    let hi = 0
    if (cfg.invert) lo -= g
    else hi += g
    m.position.y = cfg.y + rand(lo, hi)
    // 띠 윗가장자리(뒤집힌 층은 아랫가장자리) 판일수록 옅게
    let k = 1
    if (cfg.invert) k = lo !== 0 ? (m.position.y - (cfg.y - lo)) / lo : 1
    else k = hi !== 0 ? (cfg.y + hi - m.position.y) / hi : 1
    mat.uniforms.uOpacity.value *= Math.min(1, Math.max(0, k))
    m.position.z = z
    m.lookAt(this.eye)
    m.userData = {
      x0: m.position.x,
      dx: rand(-cfg.width * 0.1, cfg.width * 0.1),
      period: rand(30, 40),
      phase: Math.random() * 2,
    }
    this.scene.add(m)
    this.clouds.push(m)
  }

  // 매 프레임: 판을 카메라 쪽으로 밀고, 끝을 넘은 판은 넘은 만큼 앞에서 다시 시작(빠르게 날 때도 간격 유지)
  update(dt60, time, camZ) {
    const { cfg } = this
    const mul = this.motion > 0 ? this.speedRef.mul : 0
    const speed = 0.7 * cfg.speed * dt60 * mul
    const span = cfg.end - cfg.start
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i]
      c.position.z += speed
      // 좌우 흔들림: 30~40초에 한 번 왕복(요요)
      if (this.motion > 0) {
        const u = c.userData
        const p = ((time / u.period + u.phase) % 2 + 2) % 2
        const tri = p < 1 ? p : 2 - p
        c.position.x = u.x0 + u.dx * easeInOut(tri)
      }
      if (c.position.z > cfg.end) {
        c.position.z = cfg.start + ((c.position.z - cfg.start) % span)
        c.lookAt(this.eye)
      }
      c.renderOrder = c.position.z
      if (cfg.scale) {
        let t = cfg.fade - (camZ - c.position.z)
        if (t < 0) t = 0
        c.scale.setScalar(1 + cfg.scale * t)
      }
    }
  }

  dispose() {
    for (const c of this.clouds) {
      this.scene.remove(c)
      c.material.dispose()
    }
    this.clouds = []
    this.base.dispose()
    this.geometry.dispose()
  }
}
