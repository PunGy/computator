import { Fluid, ReactiveTransaction } from "reactive-fluid"
import type { Rect, SceneObject } from "./gmod"

export const Layout = {
  spread(base: Rect, items: Array<SceneObject>, config?: {
    direction?: "vertical" | "horizontal",
    space?: "between" | "around"
  }) {
    const { direction = "horizontal", space = "between" } = config ?? {}
    const [x1, y1] = [Fluid.read(base.data.x), Fluid.read(base.data.y)]
    const [width, height] = [Fluid.read(base.data.width), Fluid.read(base.data.height)]

    const vert = direction === "vertical"
    const around = space === "around"

    let occupiedSpace = 0

    for (const item of items) {
      occupiedSpace += Fluid.read(vert ? item.data.frameY : item.data.frameX)
    }

    const gap = Math.max(
      ((vert ? height : width) - occupiedSpace)
        / Math.max(around ? items.length + 1 : items.length - 1, 1),
      0,
    )

    let p2 = vert ? y1 : x1
    if (around) {
      p2 += gap
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!

      //
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


  center(base: SceneObject, item: SceneObject) {
    item.update(
      Fluid.transaction.compose(
        Fluid.transaction.write(item.data.relativeTo, base.data),
        Fluid.transaction.write(item.data.x, () => {
          return Fluid.transaction.resolved(
            (Fluid.read(base.data.frameX) / 2) - Fluid.read(item.data.frameX) / 2,
          )
        }),
        Fluid.transaction.write(item.data.y, () => {
          return Fluid.transaction.resolved(
            (Fluid.read(base.data.frameY) / 2) - Fluid.read(item.data.frameY) / 2,
          )
        }),
      ),
    )
  },
}
