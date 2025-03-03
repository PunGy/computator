import { Either } from "../../lib/either"
import { Fluid, ReactiveTransaction } from "reactive-fluid"
import { Parameter1, pipe } from "../../lib/function"
import {
  graphics,
  CircleObject_R,
  GObject_R,
  GraphicsMethods,
  GraphicsObjects,
  LineObject_R,
  ObjectController,
  RectObject_R,
  LineOptions,
} from "./graphics"
import { Maybe } from "../../lib/maybe"
import { vectorDistance, vectorDistance2 } from "../../lib/vector"

type ExtendedOptions<P> = P & { id?: string | number; }
type ExtendedObject<O extends GObject_R = GObject_R>
                       = Omit<ObjectController<O>, "draw">
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

export interface GMod {
  objects: ExtendedGraphicsMethods & {
    box: CreatorFor<"rect">;
    connect: (obj1: Circle, obj2: Circle, lineOpts?: Omit<LineOptions, "from" | "to">) => ExtendedObject<LineObject_R>;

    clear: () => void;
    delete: (id: string) => Maybe<ExtendedObject>;
    get: (id: string) => Maybe<ExtendedObject>;
  };

  graphics: GraphicsMethods;
}

export type SceneObject = ExtendedObject<GObject_R>
export type Rect = ExtendedObject<RectObject_R>
export type Circle = ExtendedObject<CircleObject_R>
export type Line = ExtendedObject<LineObject_R>

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
    Either.map(g => {
      let persistentIDs = 0
      const newID = () => (persistentIDs++).toString()

      const objectsEntry = new Map<string, SceneObject>()
      const visibleObjects: Set<SceneObject & { draw(): void }> = new Set()

      let scheduled = false

      function canRender<O extends ExtendedObject>(obj: O): obj is O & { draw(): void } {
        return "draw" in obj
      }

      const makeSceneObject = <T extends GObject_R>(obj: ObjectController<T>, id?: string | number): ExtendedObject<T> => {
        const sceneObject = obj as unknown as ExtendedObject<T>

        sceneObject.data.id = id?.toString() ?? newID()
        sceneObject.update = (transaction: ReactiveTransaction) => {
          if (Fluid.transaction.isResolved(transaction.run())) {
            scheduleRerender()
          }
        }
        sceneObject.delete = () => {
          objectsEntry.delete(sceneObject.data.id)
          scheduleRerender()
        }

        objectsEntry.set(sceneObject.data.id, sceneObject)
        if (canRender(sceneObject)) {

          visibleObjects.add(sceneObject)
        }

        scheduleRerender()
        return sceneObject
      }

      const creatorFor = <M extends keyof GraphicsMethods>(objConstructor: GraphicsMethods[M]): CreatorFor<M> => {
        // @ts-expect-error TS is just being obnoxious again
        return (opts) => {
          // @ts-expect-error TS is just being obnoxious again
          const obj = objConstructor(opts)
          // @ts-expect-error TS is just being obnoxious again
          return makeSceneObject(obj)
        }
      }

      const rect = creatorFor<"rect">(g.rect)
      const circle = creatorFor<"circle">(g.circle)
      const line = creatorFor<"line">(g.line)
      const text = creatorFor<"text">(g.text)

      const box = creatorFor<"rect">((opts) => {
        const obj = g.rect(opts)

        // @ts-expect-error we don't need it anymore
        delete obj.draw

        return obj
      })

      const connect = (obj1: Circle, obj2: Circle, lineOpts: Omit<LineOptions, "from" | "to"> = {}): ExtendedObject<LineObject_R> => {
        const r_c1 = Fluid.read(obj1.data.radius)
        const x_c1 = Fluid.read(obj1.data.x0)
        const y_c1 = Fluid.read(obj1.data.y0)

        const r_c2 = Fluid.read(obj2.data.radius)
        const x_c2 = Fluid.read(obj2.data.x0)
        const y_c2 = Fluid.read(obj2.data.y0)

        const dx = x_c2 - x_c1
        const dy = y_c2 - y_c1
        const distance = vectorDistance2(dx, dy)
        const ux = dx / distance
        const uy = dy / distance

        const from = {
          x: x_c1 + r_c1 * ux,
          y: y_c1 + r_c1 * uy,
        }
        const to = {
          x: x_c2 - r_c2 * ux,
          y: y_c2 - r_c2 * uy,
        }

        return makeSceneObject(g.line({
          from,
          to,
          endStyle: "target",
          relativeTo: Fluid.read(obj1.data.relativeTo),
          ...lineOpts,
        }))
      }


      const scheduleRerender = () => {
        if (!scheduled) {
          window.requestAnimationFrame(() => {
            rerender()
            scheduled = false
          })
          scheduled = true
        }
      }

      const update = (transaction: ReactiveTransaction) => {
        if (Fluid.transaction.isResolved(transaction.run())) {
          scheduleRerender()
        }
      }

      const rerender = () => {
        g.clear()
        for (const obj of visibleObjects.values()) {
          obj.draw()
        }
      }

      const clear = () => {
        for (const obj of visibleObjects.values()) {
          obj.delete()
        }
      }

      parent.appendChild(gcanvas)

      return {
        objects: {
          rect,
          circle,
          line,
          text,
          connect,

          box,
          clear,
          get(id) {
            return Maybe.fromNullable(objectsEntry.get(id))
          },
          delete(id) {
            const obj = objectsEntry.get(id)
            if (obj) {
              obj.delete()
              return Maybe.some(obj)
            }
            return Maybe.none
          },
        },

        graphics: g,
        update,
      }
    }),
  )
}

