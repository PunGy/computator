import "./index.css"

import { Fluid } from "reactive-fluid"
import { Either } from "./lib/either"
import { expose } from "./lib/expose"
import { pipe } from "./lib/function"
import { GMod } from "./services/gmod"
import { Layout } from "./services/gmod/layout"

function main(): Either<string, any> {
  const pane = document.getElementById("canvas-pane")

  if (!pane) return Either.left("Can't find a canvas-pane")

  return pipe(
    GMod(pane),
    Either.map(mainGraphics => {
      expose("mainGraphics", mainGraphics)
      expose("Fluid", Fluid)
      const make = mainGraphics.objects

      //const rect = mainGraphics.objects.rect({ x: 50, y: 50, width: 100, height: 100 })
      const rect = make.rect({ x: 50, y: 50, width: 300, height: 200 })

      Layout.spread(
        "vertical",
        rect,
        [
          make.rect({ width: 50, height: 50, color: "red" }),
          make.rect({ width: 50, height: 50, color: "red" }),
          make.rect({ width: 100, height: 50, color: "red" }),
        ],
      )
      expose("rect", rect)


      return true
    }),
  )
}

const res = main()

if (Either.isLeft(res)) {
  console.error(res.left)
}

