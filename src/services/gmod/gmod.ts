import { Either } from "../../lib/either"
import { Fluid, ReactiveTransaction } from "reactive-fluid"
import { Parameter1, pipe } from "../../lib/function"
import { GObject, graphics, GraphicsMethods, GraphicsObjects, ObjectController } from "./graphics"
import { Maybe } from "../../lib/maybe"

type ExtendedOptions<P> = P & { id?: string | number; }
type ExtendedObject<O extends GObject = GObject>
                       = ObjectController<O>
                       & { data: ObjectController<O>["data"] & { id: string } }
                       & { update: (opts: ReactiveTransaction) => void; delete: () => void}

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
  parent: HTMLElement,
): Either<string, GMod> {
  const gcanvas = document.createElement("canvas")
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
          // @ts-expect-error variances of objConstructor is merged, but during usage it works
          const obj = objConstructor(opts) as ExtendedObject<GraphicsObjects[M]>
          obj.data.id = opts.id?.toString() ?? newID()
          obj.update = (transaction: ReactiveTransaction) => {
            if (Fluid.transaction.isResolved(transaction.run())) {
              scheduleRerender()
            }
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
        for (const obj of objectsEntry.values()) {
          obj.draw()
        }
      }

      const clear = () => {
        for (const obj of objectsEntry.values()) {
          obj.delete()
        }
      }

      parent.appendChild(gcanvas)

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

