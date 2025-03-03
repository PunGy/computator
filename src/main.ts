import "./index.css"

import { Fluid } from "reactive-fluid"
import { Either } from "./lib/either"
import { expose } from "./lib/expose"
import { pipe } from "./lib/function"
import { GMod } from "./services/gmod"
import { Layout } from "./services/gmod/layout"
import { LinkedList } from "./services/structures/LinkedList/entity"
import { LinkedListDrawer } from "./services/structures/LinkedList/drawer"

function main(): Either<string, any> {
  const pane = document.getElementById("canvas-pane")

  if (!pane) return Either.left("Can't find a canvas-pane")

  return pipe(
    GMod(pane),
    Either.map(mainGraphics => {
      expose("mainGraphics", mainGraphics)
      expose("Fluid", Fluid)
      const make = mainGraphics.objects

      const rect = make.rect({ x: 50, y: 350, width: 300, height: 200 })

      Layout.spread(
        rect,
        [
          make.rect({ width: 50, height: 50, color: "red" }),
          make.rect({ width: 50, height: 50, color: "red" }),
          make.rect({ width: 100, height: 50, color: "red" }),
        ],
        { space: "around", direction: "horizontal" },
      )
      expose("rect", rect)

      const list = new LinkedList<string>()
      const listDrawer = new LinkedListDrawer(make, { x: 50, y: 50 })

      list.pushBack("1")
      list.pushBack("2")
      list.pushBack("3")
      list.pushBack("4")

      listDrawer.drawList(list)

      return true
    }),
  )
}

const res = main()

if (Either.isLeft(res)) {
  console.error(res.left)
}

