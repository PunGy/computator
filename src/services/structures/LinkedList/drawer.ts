import { Fluid } from "reactive-fluid"
import { GMod } from "../../gmod"
import { LinkedList, ListNode } from "./entity"
import { expose } from "../../../lib/expose"
import { XY } from "../../gmod/graphics"
import { Layout } from "../../gmod/layout"

export class LinkedListDrawer {
  graphics: GMod["objects"]
  direction: "horizontal" | "vertical" = "horizontal"
  gap = 50
  base: XY

  constructor(graphics: GMod["objects"], base: XY) {
    this.graphics = graphics
    this.base = base
  }

  drawList(list: LinkedList) {
    let x = this.base.x
    let y = this.base.y

    let prev: ReturnType<typeof this.drawNode>
    for (let node = list.head; node !== null; node = node.next) {
      const obj = this.drawNode(node, x, y)
      if (obj) {
        x += Fluid.read(obj.data.frameX) + 50
        y += 0

        if (prev) {
          this.graphics.connect(prev, obj)
        }
      }
      prev = obj
    }
  }

  drawNode(node: ListNode, x: number, y: number) {
    const value = node.value
    const contentType = typeof value
    let content: string
    if (contentType === "string") {
      content = value as string
    } else if (contentType === "number") {
      content = (value as number).toString()
    } else {
      return
    }
    const text = this.graphics.text({ value: content, fontSize: 25 })
    const circle = this.graphics.circle({
      x,
      y,
      radius: 30,
      width: 3,
      style: "stroke",
    })
    Layout.center(circle, text)

    expose("circle", circle)
    expose("text", text)

    return circle
  }
}
