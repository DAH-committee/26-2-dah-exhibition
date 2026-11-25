import * as THREE from 'three'
import gsap from 'gsap'
import { CloudLayer } from './CloudLayer'
import { Overlay } from './Overlay'
import { FIELD, FIELD_EYE, SCENES, PALETTES, movementFor } from './scenes'
import { backdropVertex, backdropFragment } from './shaders'

THREE.ColorManagement.enabled = false

// 하늘 그림에서 수평선이 놓인 세로 위치(위에서부터 비율). 밤 그림은 낮 그림 수평선에 맞춰 당겨 읽는다.
const HORIZON = { dusk: 0.72, night: 0.75 }
const SKY_DIST = 15000
const EXT = 3

function loadTexture(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, t => resolve(t), undefined, reject)
  })
}
const bell = t => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) // 0에서 1로 올랐다 0으로
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a))

// 장면 하나가 아니라 "하늘 하나". 구름 들판은 처음 한 번만 만들고 끝까지 그대로 둔다.
// 장면 이동은 카메라 자리, 방향, 색, 밤 정도를 한 번의 비행으로 이어서 바꾸는 일이다.
export class World {
  constructor(container, { mobile = false, reduced = false } = {}) {
    this.container = container
    this.mobile = mobile
    this.reduced = reduced
    this.motion = reduced ? 0 : 1
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, stencil: false, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.autoClear = false
    this.renderer.domElement.style.pointerEvents = 'none'
    this.renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 25000)
    this.camera.rotation.order = 'YXZ'
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#7fa3b3')

    this.shared = {
      uCamZ: { value: 0 },
      uBlend: { value: 1 },
      uFar: { value: new THREE.Color('#ffffff') },
      uNear: { value: new THREE.Color('#ffffff') },
      uShade: { value: new THREE.Color('#ffffff') },
    }
    // 위층(천장) 구름은 하늘색 쪽으로 따로 누른다(회색으로 탁해지지 않게)
    this.sharedTop = {
      uCamZ: this.shared.uCamZ,
      uBlend: { value: 1 },
      uFar: { value: new THREE.Color('#ffffff') },
      uNear: { value: new THREE.Color('#ffffff') },
      uShade: this.shared.uShade,
    }

    this.store = { pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 } }
    this.flight = { t: 0, lift: 0, swing: { x: 0, y: 0, z: 0 } } // 비행 중 곡선(오르내림과 기울기)
    this.speed = { mul: 1 } // 구름이 다가오는 속도 배율(비행 중 크게)
    this.mix = { night: 0, houses: 0 }
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    this.mouseOff = { x: 0, y: 0 }
    this.mouseAmount = 0.35
    this.trackMouse = false
    this.layers = []
    this.timelines = []
    this.time = 0
    this.sceneKey = null
    this.ready = false
    this.eye = new THREE.Vector3(...FIELD_EYE)

    this.onResize = this.onResize.bind(this)
    this.onMouse = this.onMouse.bind(this)
    this.tick = this.tick.bind(this)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onMouse, { passive: true })
    this.onResize()
  }

  async load() {
    const loader = new THREE.TextureLoader()
    const [cloud, dusk] = await Promise.all([
      loadTexture(loader, '/sky/cloud.webp'),
      loadTexture(loader, '/sky/dusk.webp'),
    ])
    for (const t of [cloud, dusk]) t.colorSpace = THREE.NoColorSpace
    this.tex = { cloud, dusk }
    // 덮개 구름도 같은 큰 그림을 쓴다(작은 그림을 크게 늘리면 뭉개져 평평한 안개처럼 보였다)
    this.overlay = new Overlay(cloud, this.mobile ? 110 : 170)
    this.overlay.resize(window.innerWidth, window.innerHeight)
    this.buildBackdrop()
    this.buildField()
    this.buildStars()
    // 밤 하늘과 집 그림은 첫 화면 뒤에 받는다
    this.nightPromise = loadTexture(loader, '/sky/night.webp').then(t => {
      t.colorSpace = THREE.NoColorSpace
      this.tex.night = t
      this.backdrop.material.uniforms.uNight.value = t
      return t
    })
    this.housesPromise = loadTexture(loader, '/sky/houses.webp').then(t => {
      t.colorSpace = THREE.NoColorSpace
      this.tex.houses = t
      this.buildHouses()
      return t
    })
    this.ready = true
  }

  start() {
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }

  onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const cap = this.mobile ? 1.5 : 2
    this.renderer.setPixelRatio(Math.min(1664 / h, cap))
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.overlay?.resize(w, h)
    this.sizeBackdrop()
  }

  onMouse(e) {
    this.mouse.x = e.clientX
    this.mouse.y = e.clientY
  }

  // ── 한 번만 만드는 것 ─────────────────────────────────────

  buildField() {
    const densityScale = this.mobile ? 0.45 : 1
    for (const cfg of FIELD) {
      this.layers.push(new CloudLayer({
        scene: this.scene, eye: this.eye, texture: this.tex.cloud, cfg,
        shared: cfg.invert ? this.sharedTop : this.shared, densityScale, motion: this.motion, speed: this.speed,
      }))
    }
    // 첫 프레임 앞에서 구름을 조금 흘려 두어 빈 구간이 없게 한다
    for (let i = 0; i < 2; i++) this.layers.forEach(l => l.update(1, 0, this.eye.z))
  }

  // 하늘 판: 카메라 앞 먼 곳에 세우고 카메라 자리와 좌우 방향을 따라간다.
  // 좌우로 돌 때는 그림을 반대로 밀어 아주 먼 하늘처럼 보이게 하고, 낮과 밤 그림을 섞어 그린다.
  buildBackdrop() {
    const geo = new THREE.PlaneGeometry(2 * EXT, EXT)
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uDusk: { value: this.tex.dusk },
        uNight: { value: this.tex.dusk },
        uMix: { value: 0 },
        uShiftU: { value: 0 },
        uNightV: { value: HORIZON.night - HORIZON.dusk },
        uExt: { value: EXT },
      },
      vertexShader: backdropVertex,
      fragmentShader: backdropFragment,
      depthWrite: false,
      depthTest: false,
    })
    this.backdrop = new THREE.Mesh(geo, mat)
    this.backdrop.renderOrder = -100000
    this.backdrop.frustumCulled = false
    this.scene.add(this.backdrop)
    this.sizeBackdrop()
  }

  sizeBackdrop() {
    if (!this.backdrop) return
    const V = 2 * SKY_DIST * Math.tan(THREE.MathUtils.degToRad(15))
    const s = this.mobile ? 0.6 : 0.58 // 수평선이 화면 위에서 58% 지점
    const tTop = 0.3
    const aspect = window.innerWidth / window.innerHeight
    const H = Math.max((V * s) / (HORIZON.dusk - tTop), V * aspect * 0.75)
    this.skyH = H
    this.skyLift = (0.5 - s) * V - (0.5 - HORIZON.dusk) * H
    this.backdrop.scale.set(H, H, 1)
  }

  placeBackdrop(cam) {
    const yaw = this.store.rot.y + this.flight.swing.y
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0, 'YXZ'))
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(q)
    const p = cam.position.clone().addScaledVector(dir, SKY_DIST)
    p.y = this.eye.y + this.skyLift // 하늘은 카메라가 오르내려도 제자리(아주 먼 곳)
    this.backdrop.position.copy(p)
    this.backdrop.quaternion.copy(q)
    this.backdrop.material.uniforms.uShiftU.value = -yaw * SKY_DIST / (2 * this.skyH)
  }

  // 밤 장면: 작품 수만큼 금색 별. 하늘 판처럼 카메라 방향을 따라가는 먼 층에 둔다.
  buildStars(count = 69) {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 64
    const ctx = cv.getContext('2d')
    ctx.translate(32, 32)
    ctx.shadowColor = 'rgba(245, 200, 76, 0.9)'
    ctx.shadowBlur = 10
    ctx.fillStyle = '#f7cf5e'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 === 0 ? 17 : 7
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r)
    }
    ctx.closePath()
    ctx.fill()
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.NoColorSpace
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos.set([(Math.random() - 0.5) * 14000, 900 + Math.random() * 2600, -6000 - Math.random() * 1500], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({ map: tex, size: this.mobile ? 22 : 26, sizeAttenuation: false, transparent: true, depthWrite: false, depthTest: false, opacity: 0 })
    this.stars = new THREE.Points(geo, mat)
    this.stars.renderOrder = -90000
    this.stars.frustumCulled = false
    this.scene.add(this.stars)
  }

  // 옥상과 집 그림 판(인트로). 아랫부분은 구름색 그라데이션 판으로 덮어 구름 속에 묻는다(보고서 2-6).
  buildHouses() {
    const tex = this.tex.houses
    const aspect = tex.image.width / tex.image.height
    const w = this.mobile ? 2600 : 4200
    const h = w / aspect
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: new THREE.Color('#f3e4de'), opacity: 0 })
    const houses = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    const hx = this.mobile ? 500 : 1500
    houses.position.set(hx, 640 - h / 2, -1500)
    houses.lookAt(new THREE.Vector3(hx, houses.position.y, 20000))
    houses.renderOrder = -1500
    this.scene.add(houses)

    const cv = document.createElement('canvas')
    cv.width = 1024
    cv.height = 512
    const ctx = cv.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, cv.height)
    grad.addColorStop(0, 'rgba(206, 216, 222, 0)')
    grad.addColorStop(0.18, 'rgba(206, 216, 222, 0)')
    grad.addColorStop(0.32, 'rgba(204, 215, 222, 0.72)')
    grad.addColorStop(1, 'rgba(198, 211, 220, 0.9)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.globalCompositeOperation = 'destination-in'
    const side = ctx.createLinearGradient(0, 0, cv.width, 0)
    side.addColorStop(0, 'rgba(0,0,0,0)')
    side.addColorStop(0.18, 'rgba(0,0,0,1)')
    side.addColorStop(0.82, 'rgba(0,0,0,1)')
    side.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = side
    ctx.fillRect(0, 0, cv.width, cv.height)
    const coverTex = new THREE.CanvasTexture(cv)
    coverTex.colorSpace = THREE.NoColorSpace
    const cover = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 1.6, h * 3),
      new THREE.MeshBasicMaterial({ map: coverTex, transparent: true, depthWrite: false, opacity: 0 }),
    )
    const houseBottom = houses.position.y - h / 2
    const coverTop = houseBottom + h * 0.15 + 0.32 * h * 3
    cover.position.set(hx, coverTop - (h * 3) / 2, -1200)
    cover.lookAt(new THREE.Vector3(hx, cover.position.y, 20000))
    cover.renderOrder = -1000
    this.scene.add(cover)
    this.houses = [houses, cover]
    this.applyHouses()
  }

  applyHouses() {
    const v = this.mix.houses
    if (!this.houses) return
    for (const m of this.houses) {
      m.material.opacity = v
      m.visible = v > 0.002
    }
  }

  // ── 색 ────────────────────────────────────────────────────

  paletteTargets(name) {
    const p = PALETTES[name] ?? PALETTES.dusk
    return {
      far: new THREE.Color(p.far), near: new THREE.Color(p.near), shade: new THREE.Color(p.shade), bg: new THREE.Color(p.bg),
      topFar: new THREE.Color(p.topFar ?? p.far), topNear: new THREE.Color(p.topNear ?? p.near),
      blend: p.blend, topBlend: p.topBlend ?? p.blend, overlay: new THREE.Color(p.overlay ?? '#ffffff'),
    }
  }

  snapshotPalette() {
    return {
      far: this.shared.uFar.value.clone(), near: this.shared.uNear.value.clone(), shade: this.shared.uShade.value.clone(),
      bg: this.scene.background.clone(), topFar: this.sharedTop.uFar.value.clone(), topNear: this.sharedTop.uNear.value.clone(),
      blend: this.shared.uBlend.value, topBlend: this.sharedTop.uBlend.value,
    }
  }

  setPaletteMix(a, b, t) {
    this.shared.uFar.value.copy(a.far).lerp(b.far, t)
    this.shared.uNear.value.copy(a.near).lerp(b.near, t)
    this.shared.uShade.value.copy(a.shade).lerp(b.shade, t)
    this.scene.background.copy(a.bg).lerp(b.bg, t)
    this.sharedTop.uFar.value.copy(a.topFar).lerp(b.topFar, t)
    this.sharedTop.uNear.value.copy(a.topNear).lerp(b.topNear, t)
    this.shared.uBlend.value = a.blend + (b.blend - a.blend) * t
    this.sharedTop.uBlend.value = a.topBlend + (b.topBlend - a.topBlend) * t
  }

  // ── 장면 ──────────────────────────────────────────────────

  killTimelines() {
    this.timelines.forEach(t => t.kill())
    this.timelines = []
  }

  targetOf(key) {
    const cfg = SCENES[key] ?? SCENES.home
    const cam = cfg.cam()
    return {
      cfg,
      pos: { x: cam.pos[0], y: cam.pos[1], z: cam.pos[2] },
      rot: { x: cam.rot[0], y: cam.rot[1], z: cam.rot[2] },
      night: cfg.sky === 'night' ? 1 : 0,
      houses: cfg.houses ? 1 : 0,
      stars: cfg.stars ? 1 : 0,
    }
  }

  // 첫 장면(주소로 바로 들어왔을 때): 그 자리에 바로 둔다
  async setScene(key) {
    const t = this.targetOf(key)
    this.killTimelines()
    this.sceneKey = key
    this.cfg = t.cfg
    if (t.night && !this.tex.night) await this.nightPromise
    Object.assign(this.store.pos, t.pos)
    Object.assign(this.store.rot, t.rot)
    this.setPaletteMix(this.paletteTargets(t.cfg.palette), this.paletteTargets(t.cfg.palette), 1)
    this.mix.night = t.night
    this.mix.houses = t.houses
    this.stars.material.opacity = t.stars
    this.applyHouses()
    this.trackMouse = true
    if (t.cfg.houses && !this.reduced) {
      // 인트로: x -850, z +1000 지점에서 10초 동안 출발점 z -1000 지점까지 미끄러지며 집에 다가간다
      if (!this.houses) this.housesPromise?.then(() => this.applyHouses())
      const p = t.pos
      this.timelines.push(gsap.fromTo(this.store.pos,
        { x: p.x - 850, z: p.z + 1000 },
        { x: p.x, y: p.y, z: p.z - 1000, duration: 10, ease: 'power2.out' }))
    }
  }

  // 장면 이동: 지금 카메라 자리에서 시작하는 한 번의 비행.
  // 구름을 다시 만들지 않으므로 중간에 끊기거나 되돌아가는 지점이 없다.
  // 앞으로 빨라지며(구름이 쏟아져 들어오며) 진행 방향으로 몸을 틀고, 구름 층 속으로 들어갔다가
  // 도착 장면의 하늘로 빠져나오며 속도를 늦춘다. 색과 밤 정도는 비행 내내 이어서 바뀐다.
  flyTo(key, { direction = 'None', duration = 5 } = {}) {
    const t = this.targetOf(key)
    this.killTimelines()
    this.sceneKey = key
    this.cfg = t.cfg
    if (t.night && !this.tex.night) this.nightPromise?.then(() => {})

    // 같은 하늘 안 이동(작품 목록과 작품 상세): 짧게 앞으로 밀려 나가는 느낌만
    if (direction === 'None' || this.reduced) {
      if (this.reduced) {
        Object.assign(this.store.pos, t.pos)
        Object.assign(this.store.rot, t.rot)
        const pal = this.paletteTargets(t.cfg.palette)
        this.setPaletteMix(pal, pal, 1)
        this.mix.night = t.night
        this.mix.houses = t.houses
        this.stars.material.opacity = t.stars
        this.applyHouses()
        return
      }
      const tl = gsap.timeline()
      tl.to(this.speed, { mul: 6, duration: duration * 0.4, ease: 'power2.in' }, 0)
      tl.to(this.speed, { mul: 1, duration: duration * 0.6, ease: 'power2.out' }, duration * 0.4)
      this.timelines.push(tl)
      return
    }

    const e = movementFor(direction)
    const D = duration
    const fromPos = { ...this.store.pos }
    const fromRot = { ...this.store.rot }
    const dy = wrapAngle(t.rot.y - fromRot.y)
    const toRot = { x: t.rot.x, y: fromRot.y + dy, z: t.rot.z }
    const fromPal = this.snapshotPalette()
    const toPal = this.paletteTargets(t.cfg.palette)
    const fromNight = this.mix.night
    const fromHouses = this.mix.houses
    const fromStars = this.stars.material.opacity
    // 위쪽 장면은 천장 구름 속으로 솟고, 나머지는 아래 구름 바다 속으로 잠긴다
    const up = e.x > 0
    const depth = up ? 1300 : -700
    const swing = { x: up ? e.x * 0.18 : -0.07, y: e.y * 0.55, z: e.z * 0.9 }

    this.trackMouse = false
    const o = { t: 0 }
    const tl = gsap.timeline({ onComplete: () => { this.trackMouse = true } })
    // 몸통 이동: 하나의 곡선(시작 천천히, 가운데 빠르게, 끝 천천히)
    tl.to(o, {
      t: 1, duration: D, ease: 'power2.inOut',
      onUpdate: () => {
        const k = o.t
        this.store.pos.x = fromPos.x + (t.pos.x - fromPos.x) * k
        this.store.pos.y = fromPos.y + (t.pos.y - fromPos.y) * k
        this.store.pos.z = fromPos.z + (t.pos.z - fromPos.z) * k
        this.store.rot.x = fromRot.x + (toRot.x - fromRot.x) * k
        this.store.rot.y = fromRot.y + (toRot.y - fromRot.y) * k
        this.store.rot.z = fromRot.z + (toRot.z - fromRot.z) * k
      },
    }, 0)
    // 오르내림과 진행 방향으로 틀기: 한 번 올라갔다 내려오는 종 모양(되돌아 꺾이는 지점 없음)
    const f = { t: 0 }
    tl.to(f, {
      t: 1, duration: D, ease: 'sine.inOut',
      onUpdate: () => {
        const b = bell(f.t)
        const b2 = b * b * (3 - 2 * b) // 가운데를 더 오래 머물게
        this.flight.lift = depth * b2
        this.flight.swing.x = swing.x * b
        this.flight.swing.y = swing.y * b
        this.flight.swing.z = swing.z * b
      },
    }, 0)
    // 구름이 쏟아져 들어오는 속도: 앞 45%에서 올리고 뒤 55%에서 내린다
    tl.to(this.speed, { mul: 34, duration: D * 0.45, ease: 'power2.in' }, 0)
    tl.to(this.speed, { mul: 1, duration: D * 0.55, ease: 'power3.out' }, D * 0.45)
    // 색과 밤 정도, 별, 집: 비행 15%부터 90%까지 이어서
    const c = { t: 0 }
    tl.to(c, {
      t: 1, duration: D * 0.75, ease: 'sine.inOut',
      onUpdate: () => {
        this.setPaletteMix(fromPal, toPal, c.t)
        this.mix.night = fromNight + (t.night - fromNight) * c.t
        this.mix.houses = fromHouses + (t.houses - fromHouses) * Math.min(1, c.t * 2)
        this.stars.material.opacity = fromStars + (t.stars - fromStars) * c.t * c.t
        this.applyHouses()
      },
    }, D * 0.15)
    this.timelines.push(tl)
  }

  // ── 덮개 구름(화면 앞을 스쳐 지나가는 2D 구름) ─────────────

  overlayStart(fromPalette, toPalette, duration = 5) {
    if (!this.overlay || this.reduced) return
    const fromC = new THREE.Color(PALETTES[fromPalette]?.overlay ?? '#ffffff')
    const toC = new THREE.Color(PALETTES[toPalette]?.overlay ?? '#ffffff')
    this.overlay.start({ tint: fromC })
    const tint = this.overlay.material.uniforms.uTint.value
    const o = { t: 0 }
    gsap.to(o, {
      t: 1, delay: duration * 0.15, duration: duration * 0.7, ease: 'sine.inOut',
      onUpdate: () => tint.copy(fromC).lerp(toC, o.t),
    })
  }

  overlayFade(to, duration = 0.75) {
    if (!this.overlay) return
    gsap.to(this.overlay.material.uniforms.uOpacity, {
      value: to, duration, ease: 'sine.inOut', overwrite: true,
      onComplete: () => { if (to === 0) this.overlay.stop() },
    })
  }

  // ── 매 프레임 ─────────────────────────────────────────────

  tick(now) {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    if (!this.sceneKey || document.hidden) return
    this.time += dt
    const dt60 = dt * 60
    const cam = this.camera

    // 마우스 기울기(보고서 3-4): 목표 = -(마우스-중앙) x amount x 0.00008, 프레임당 1% 지수 감쇠
    const k = 1 - Math.pow(1 - 0.01, dt60)
    const tx = this.trackMouse && !this.reduced ? -(this.mouse.y - window.innerHeight / 2) * this.mouseAmount * 0.00008 : 0
    const ty = this.trackMouse && !this.reduced ? -(this.mouse.x - window.innerWidth / 2) * this.mouseAmount * 0.00008 : 0
    this.mouseOff.x += (tx - this.mouseOff.x) * k
    this.mouseOff.y += (ty - this.mouseOff.y) * k

    const s = this.flight.swing
    cam.rotation.set(
      this.store.rot.x + s.x + this.mouseOff.x,
      this.store.rot.y + s.y + this.mouseOff.y,
      this.store.rot.z + s.z + this.mouseOff.y * 0.5,
    )
    cam.position.set(this.store.pos.x, this.store.pos.y + this.flight.lift, this.store.pos.z)
    this.shared.uCamZ.value = cam.position.z

    for (const l of this.layers) l.update(dt60, this.time, cam.position.z)
    this.placeBackdrop(cam)
    this.backdrop.material.uniforms.uMix.value = this.mix.night
    if (this.stars) {
      this.stars.position.set(cam.position.x, 0, cam.position.z)
      this.stars.rotation.set(0, this.store.rot.y + s.y, 0)
      this.stars.visible = this.stars.material.opacity > 0.002
    }

    this.renderer.clear()
    this.renderer.render(this.scene, cam)
    if (this.overlay && this.overlay.running) {
      this.overlay.update(dt, s.y, cam.rotation.z)
      if (this.overlay.opacity > 0.001) {
        this.renderer.clearDepth()
        this.renderer.render(this.overlay.scene, this.overlay.camera)
      }
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onMouse)
    this.killTimelines()
    this.layers.forEach(l => l.dispose())
    this.overlay?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
