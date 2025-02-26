import "./index.css"

import { Fluid } from "reactive-fluid"
import { Either } from "./lib/either"
import { expose } from "./lib/expose"
import { pipe } from "./lib/function"
import { GMod } from "./lib/gmod/gmod"

function main(): Either<string, any> {
  const pane = document.getElementById("canvas-pane")

  if (!pane) return Either.left("Can't find a canvas-pane")

  return pipe(
    GMod(pane),
    Either.map(mainGraphics => {
      expose("mainGraphics", mainGraphics)
      expose("Fluid", Fluid)

      const rect = mainGraphics.rect({ x: 50, y: 50, width: 100, height: 100 })
      expose("rect", rect)

      setInterval(() => {
        rect.update(
          Fluid.transaction.write(rect.data.x, Fluid.read(rect.data.x) + 10),
        )
      }, 1000)

      return true
    }),
  )
}

const res = main()

if (Either.isLeft(res)) {
  console.error(res.left)
}

