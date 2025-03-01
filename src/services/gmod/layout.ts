import { Fluid, ReactiveTransaction } from "reactive-fluid"
import type { Rect, SceneObject } from "./gmod"

export const Layout = {
  spread(direction: "horizontal" | "vertical", base: Rect, items: Array<SceneObject>) {
    const [x1, y1] = [Fluid.read(base.data.x), Fluid.read(base.data.y)]
    const [width, height] = [Fluid.read(base.data.width), Fluid.read(base.data.height)]

    const vert = direction === "vertical"

    let occupiedSpace = 0

    for (const item of items) {
      occupiedSpace += Fluid.read(vert ? item.data.frameY : item.data.frameX)
    }

    const gap = Math.max(((vert ? height : width) - occupiedSpace) / Math.max(items.length - 1, 1), 0)

    let p2 = vert ? x1 : y1
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!

      item.update(Fluid.transaction.write(
        vert ? item.data.y : item.data.x,
        () => Fluid.transaction.resolved(p2),
      ))
      item.update(Fluid.transaction.write(
        vert ? item.data.x : item.data.y,
        () => Fluid.transaction.resolved(vert ? x1 : y1),
      ))

      p2 += Fluid.read(vert ? item.data.frameY : item.data.frameX) + gap
    }
  },
}
