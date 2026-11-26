import * as THREE from 'three'
import { overlayVertex, overlayFragment, fillVertex, fillFragment } from './shaders'

const rand = (a, b) => a + Math.random() * (b - a)

// 장면 전환 때 화면을 덮고 지나가는 구름 벽(SKY 원본 TransitionGenerator와 같은 방식).
// 구름 판 수백 장을 진행 방향 앞쪽(화면 밖)에 두었다가 한 방향으로 흘려 화면을 가로질러 반대편으로 빠져나가게 한다.
// 흐름은 시간이 갈수록 빨라지고(누적 프레임에 비례), 덮개 전체를 진행 방향 각도와 카메라 기울기만큼 돌린다.
// 왼쪽으로 가면 구름이 오른쪽으로, 위로 가면 아래로 지나간다.
export class Overlay {
  constructor(texture, count = 450) {
    this.count = count
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geo = new THREE.InstancedBufferGeometry()
    const quad = new THREE.PlaneGeometry(1, 1)
    geo.index = quad.index
    geo.setAttribute('position', quad.getAttribute('position'))
    geo.setAttribute('uv', quad.getAttribute('uv'))
    this.pos = new Float32Array(count * 2)
    this.angle = new Float32Array(count)
    this.size = new Float32Array(count)
    this.alpha = new Float32Array(count)
    this.y0 = new Float32Array(count)
    this.speed = new Float32Array(count)
    this.spin = new Float32Array(count)
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(this.pos, 2))
    geo.setAttribute('aAngle', new THREE.InstancedBufferAttribute(this.angle, 1))
    geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(this.size, 1))
    geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(this.alpha, 1))
    geo.instanceCount = count
    this.geo = geo
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uTint: { value: new THREE.Color('#ffffff') },
        uOpacity: { value: 0 },
        uSize: { value: new THREE.Vector2(1440, 900) },
        uRot: { value: 0 },
        uScroll: { value: 0 },
      },
      vertexShader: overlayVertex,
      fragmentShader: overlayFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    // 화면 전체 구름 속 층(맨 아래). 구름 판과 같은 방향, 같은 속도로 흘러 빈틈 없이 덮는다
    this.fillMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTint: this.material.uniforms.uTint,
        uOpacity: this.material.uniforms.uOpacity,
        uSize: this.material.uniforms.uSize,
        uRot: this.material.uniforms.uRot,
        uScroll: this.material.uniforms.uScroll,
      },
      vertexShader: fillVertex,
      fragmentShader: fillFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    this.fill = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fillMaterial)
    this.fill.frustumCulled = false
    this.fill.renderOrder = -1
    this.scene.add(this.fill)
    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
    this.running = false
    this.elapsed = 0
    this.frames = 0
    this.dirDeg = 0
    this.w = 1440
    this.h = 900
  }

  get opacity() {
    return this.material.uniforms.uOpacity.value
  }

  resize(w, h) {
    this.w = w
    this.h = h
    this.material.uniforms.uSize.value.set(w, h)
  }

  // 원본 값: 판 크기 = 3 x (창 높이/1080)^2 x 4 x 128px, 출발 위치는 가로 -2W~2W, 세로 -2H~2H에서 2H만큼 앞쪽
  start({ tint, dirDeg = 0 } = {}) {
    if (tint) this.material.uniforms.uTint.value.copy(tint)
    const { w, h } = this
    const k = h / 1080
    const size = 3 * k * k * 4 * 128
    this.dirDeg = dirDeg
    for (let i = 0; i < this.count; i++) {
      this.pos[i * 2] = rand(-2 * w, 2 * w)
      this.y0[i] = rand(-2 * h, 2 * h) - 2 * h
      this.pos[i * 2 + 1] = this.y0[i]
      this.angle[i] = rand(0, Math.PI * 2)
      this.size[i] = size * rand(0.9, 1.1)
      this.alpha[i] = rand(0.85, 1.0)
      this.speed[i] = rand(10, 40)
      this.spin[i] = THREE.MathUtils.degToRad(rand(1, 2))
    }
    this.elapsed = 0
    this.frames = 0
    this.scroll = 0
    this.running = true
    this.markDirty()
  }

  markDirty() {
    for (const k of ['aPos', 'aAngle', 'aAlpha', 'aSize']) this.geo.getAttribute(k).needsUpdate = true
  }

  // roll: 3D 카메라의 기울기(라디안). 원본처럼 덮개 각도에 더한다
  update(dt, _turn = 0, roll = 0) {
    if (!this.running) return
    this.elapsed += dt
    const f = dt * 60
    this.frames += f
    const u = this.material.uniforms
    u.uRot.value = THREE.MathUtils.degToRad(this.dirDeg) + roll
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const k = (this.h / 1080) * dpr * f * this.frames * 0.005
    for (let i = 0; i < this.count; i++) {
      this.pos[i * 2 + 1] += this.speed[i] * k
      this.angle[i] += this.spin[i] * f
    }
    // 구름 속 층도 같은 흐름(평균 속도 25)으로 민다
    this.scroll += 25 * k
    u.uScroll.value = this.scroll
    this.markDirty()
  }

  stop() {
    this.running = false
    this.material.uniforms.uOpacity.value = 0
  }

  dispose() {
    this.geo.dispose()
    this.material.dispose()
    this.fill.geometry.dispose()
    this.fillMaterial.dispose()
  }
}
