import { Either } from "../either"
import { Fluid } from "../fluid"
import { Parameter1, pipe } from "../function"
import { GObject, graphics, GraphicsMethods, GraphicsObjects, ObjectController } from "./graphics"
import { Maybe } from "../maybe"

type ExtendedOptions<P> = P & { id?: string | number; }
type ExtendedObject<O extends GObject = GObject>
                       = ObjectController<O>
                       & { data: ObjectController<O>["data"] & { id: string } }
                       & { update: (opts: Partial<O>) => void; delete: () => void}

type GraphicsFunction = { [method in keyof GraphicsMethods]: GraphicsMethods[method] }[keyof GraphicsMethods]

export type ExtendedGraphicsMethods = {
  [method in keyof GraphicsMethods]: (
    opts: ExtendedOptions<Parameter1<GraphicsMethods[method]>>
  ) => ExtendedObject<GraphicsObjects[method]>
}

type CreatorFor<M extends keyof GraphicsMethods> = (
  props: ExtendedOptions<Parameter1<GraphicsMethods[M]>>,
) => ExtendedObject<GraphicsObjects[M]>;

export type GMod = ExtendedGraphicsMethods & {
  clear: () => void;
  delete: (id: string) => Maybe<ExtendedObject>;
}

export function GMod(
  parent: HTMLDivElement,
): Either<string, GMod> {
  const gcanvas = new HTMLCanvasElement()
  const _widht_ = Fluid.val(parent.clientWidth)
  const _height_ = Fluid.val(parent.clientHeight)

  return pipe(
    graphics(
      gcanvas,
      _widht_,
      _height_,
    ),
    Either.map(g => ({ g })),
    Either.map(({ g }) => {
      let persistentIDs = 0
      const newID = () => (persistentIDs++).toString()

      const objectsEntry = new Map<string, ExtendedObject<GObject>>()

      let scheduled = false

      const creatorFor = <M extends keyof GraphicsMethods>(objConstructor: GraphicsMethods[M]): CreatorFor<M> => {
        return (opts) => {
          const obj = objConstructor(opts) as ExtendedObject<GraphicsObjects[M]>
          obj.data.id = opts.id?.toString() ?? newID()
          obj.update = (opts) => {

          }
          obj.delete = () => {
            objectsEntry.delete(obj.data.id)
            scheduleRerender()
          }

          objectsEntry.set(obj.data.id, obj)

          scheduleRerender()
          return obj
        }
      }

      const rect = creatorFor<"rect">(g.rect)
      const circle = creatorFor<"circle">(g.circle)
      const line = creatorFor<"line">(g.line)
      const text = creatorFor<"text">(g.text)

      const scheduleRerender = () => {
        if (!scheduled) {
          window.requestAnimationFrame(() => {
            rerender()
            scheduled = false
          })
          scheduled = true
        }
      }
      const rerender = () => {
        g.clear()
        Object.values(objectsEntry).forEach(obj => {
          obj.draw()
        })
      }

      const clear = () => {
        for (const obj of objectsEntry.values()) {
          obj.delete()
        }
      }

      return {
        rect,
        circle,
        line,
        text,

        clear,
        delete(id) {
          const obj = objectsEntry.get(id)
          if (obj) {
            obj.delete()
            return Maybe.some(obj)
          }
          return Maybe.none
        },
      }
    }),
  )
}

