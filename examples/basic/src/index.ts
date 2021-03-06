import {
  ComponentOf,
  createComponentFactory,
  createQuery,
  createStorage,
  number,
} from "@javelin/ecs"
import { app, framerate, graphics } from "./graphics"

enum Tags {
  Influenced = 1,
}

const storage = createStorage()
const Position = createComponentFactory(
  {
    type: 1,
    schema: {
      x: number,
      y: number,
    },
  },
  (c, x = 0, y = 0) => {
    c.x = x
    c.y = y
  },
)
const Velocity = createComponentFactory({
  type: 2,
  schema: {
    x: number,
    y: number,
  },
})
const Wormhole = createComponentFactory(
  {
    type: 3,
    schema: {
      radius: number,
    },
  },
  (c, r = 0) => (c.radius = r),
)

const junkCount = 15000
const calcWormholeHorizon = (w: ComponentOf<typeof Wormhole>) => w.radius / 10

for (let i = 0; i < junkCount; i++) {
  storage.create([
    Position.create(Math.random() * 800, Math.random() * 600),
    Velocity.create(),
  ])
}

const junk = createQuery(Position, Velocity)
const wormholes = createQuery(Position, Wormhole)

let toRemove = new Set<number>()
let tick = 0

function loop() {
  // render system
  graphics.clear()

  if (tick % 60 === 0) {
    framerate.text = `${app.ticker.FPS.toFixed(0)}`
  }

  for (const [p] of junk.run(storage)) {
    graphics.beginFill(
      storage.hasTag(p._e, Tags.Influenced) ? 0xee0000 : 0xeeeeee,
    )
    graphics.drawRect(p.x, p.y, 1, 1)
    graphics.endFill()
  }

  for (const [p, w] of wormholes.run(storage)) {
    graphics.beginFill(0x000000)
    graphics.lineStyle(1, 0x333333, 1)
    graphics.drawCircle(p.x, p.y, calcWormholeHorizon(w as any))
    graphics.endFill()
  }

  // wormhole system
  for (const [jp, jv] of junk.run(storage)) {
    for (const [wp, w] of wormholes.run(storage)) {
      const dx = wp.x - jp.x
      const dy = wp.y - jp.y
      const len = Math.sqrt(dx * dx + dy * dy)

      if (len <= w.radius) {
        storage.addTag(jp._e, Tags.Influenced)
        if (len < calcWormholeHorizon(w as any)) {
          toRemove.add(jp._e)
          w.radius += 0.1
        } else {
          const nx = dx / len
          const ny = dy / len

          jv.x += nx / 100
          jv.y += ny / 100
        }
      }
    }
  }

  // physics system
  for (const [p, v] of junk.run(storage)) {
    p.x += v.x
    p.y += v.y
  }

  toRemove.forEach(e => storage.destroy(e))
  toRemove.clear()

  tick++

  requestAnimationFrame(loop)
}

let ix = 0
let iy = 0

function onPointerDown(event: any) {
  ix = event.data.global.x
  iy = event.data.global.y
}

app.renderer.plugins.interaction.on("pointerdown", onPointerDown)
app.renderer.plugins.interaction.on("pointerup", onClick)

function onClick(event: any) {
  const dx = event.data.global.x - ix
  const dy = event.data.global.y - iy
  const r = Math.sqrt(dx * dx + dy * dy) * 10

  storage.create([Position.create(ix, iy), Wormhole.create(r)])
}

loop()
