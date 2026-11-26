import * as THREE from 'three'
import { overlayVertex, overlayFragment, fillVertex, fillFragment } from './shaders'

const rand = (a, b) => a + Math.random() * (b - a)

// 장면 전환 때 화면 앞을 스치는 구름. 진행 방향(화면 가운데)에서 바깥으로 퍼지며 다가온다.
// 3D 구름 들판과 같은 방향으로 날아가는 것처럼 보이게 해서, 덮개가 켜지고 꺼질 때 따로 노는 느낌을 없앤다.
export class Overlay {
  constructor(texture, count = 260) {
    this.count = count
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geo = new THREE.InstancedBufferGeometry()
    const quad = new THREE.PlaneGeometry(1, 1)
    geo.index = quad.index
    geo.setAttribute('position', quad.getAttribute('position'))
    geo.setAttribute('uv', quad.getAttribute('uv'))
    this.dir = new Float32Array(count * 2)
    this.z = new Float32Array(count)
    this.angle = new Float32Array(count)
    this.alpha = new Float32Array(count)
    this.size = new Float32Array(count)
    this.spin = new Float32Array(count)
    geo.setAttribute('aDir', new THREE.InstancedBufferAttribute(this.dir, 2))
    geo.setAttribute('aZ', new THREE.InstancedBufferAttribute(this.z, 1))
    geo.setAttribute('aAngle', new THREE.InstancedBufferAttribute(this.angle, 1))
    geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(this.alpha, 1))
    geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(this.size, 1))
    geo.instanceCount = count
    this.geo = geo
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uTint: { value: new THREE.Color('#ffffff') },
        uOpacity: { value: 0 },
        uHalf: { value: new THREE.Vector2(720, 450) },
        uCenter: { value: new THREE.Vector2(0, 0) },
        uRoll: { value: 0 },
      },
      vertexShader: overlayVertex,
      fragmentShader: overlayFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    // 화면 전체 구름 속 층(맨 아래). 색과 불투명도는 위 구름 판들과 같은 값을 함께 쓴다
    this.fillMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTint: this.material.uniforms.uTint,
        uOpacity: this.material.uniforms.uOpacity,
        uHalf: this.material.uniforms.uHalf,
        uRoll: this.material.uniforms.uRoll,
        uTime: { value: 0 },
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
  }

  get opacity() {
    return this.material.uniforms.uOpacity.value
  }

  resize(w, h) {
    this.w = w
    this.h = h
    this.material.uniforms.uHalf.value.set(w / 2, h / 2)
  }

  seed(i, z) {
    const { w, h } = this
    const a = rand(0, Math.PI * 2)
    // 가운데를 비우지 않도록 반지름은 0부터, 화면 대각선 쪽으로 넉넉히
    const r = Math.sqrt(Math.random()) * Math.hypot(w, h) * 0.32
    this.dir[i * 2] = Math.cos(a) * r
    this.dir[i * 2 + 1] = Math.sin(a) * r * 0.8
    this.z[i] = z
    this.angle[i] = rand(0, Math.PI * 2)
    this.size[i] = h * rand(0.32, 0.55)
  }

  start({ tint } = {}) {
    if (tint) this.material.uniforms.uTint.value.copy(tint)
    for (let i = 0; i < this.count; i++) {
      this.seed(i, rand(0.15, 1.0))
      this.alpha[i] = rand(0.4, 0.8) // 원본 값(0.4~0.8)
      this.spin[i] = THREE.MathUtils.degToRad(rand(-0.25, 0.25))
    }
    this.elapsed = 0
    this.running = true
    this.markDirty()
  }

  markDirty() {
    for (const k of ['aDir', 'aZ', 'aAngle', 'aAlpha', 'aSize']) this.geo.getAttribute(k).needsUpdate = true
  }

  // turn: 비행 중 좌우로 트는 양(라디안). 진행 방향 쪽으로 퍼짐 중심을 옮긴다.
  update(dt, turn = 0, roll = 0) {
    if (!this.running) return
    this.elapsed += dt
    const u = this.material.uniforms
    this.fillMaterial.uniforms.uTime.value = this.elapsed
    u.uCenter.value.set(-turn * this.w * 0.9, 0)
    u.uRoll.value = roll
    // 점점 빨라졌다가(앞으로 쏟아짐) 덮개가 걷힐 무렵 느려진다
    const t = this.elapsed
    const rate = 0.22 + 0.55 * Math.min(1, t / 2.2)
    for (let i = 0; i < this.count; i++) {
      this.z[i] -= rate * dt * (0.7 + (i % 7) * 0.08)
      if (this.z[i] < 0.06) this.seed(i, 1.0)
      this.angle[i] += this.spin[i] * dt * 60
    }
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
