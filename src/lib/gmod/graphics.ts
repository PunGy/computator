import { Either } from "../either"
import { Fluid, Reactive, ReactiveDerivation, ReactiveValue } from "../fluid"
import { flow } from "../function"
import { lazy } from "../lazy"

export interface XY {
  x: number;
  y: number;
}

export interface GObjectOptions extends XY {
  color?: string;
  relativeTo?: "screen"|"canvas"|GObjectOptions;
}
export type GObject = Required<GObjectOptions>

export interface TextOptions extends GObjectOptions {
  value: string;

  fontFamily?: string;
  fontSize?: number;
}
export interface TextObject extends Required<TextOptions> {
  value: string;
  metrics: TextMetrics;
}

export type ShapeStyle = "fill" | "stroke"
export interface RectOptions extends GObjectOptions {
  width: number;
  height: number;
  style?: ShapeStyle;
}
export type RectObject = Required<RectOptions>

export interface CircleOptions extends GObjectOptions {
  radius: number;
  style: "fill" | "stroke";
}
export type CircleObject = Required<CircleOptions>

export type ArrowStyle = "target" | "dot" | "none";

export interface LineOptions extends Omit<GObjectOptions, "x" | "y"> {
  from: XY;
  to: XY;
  width?: number;
  beginStyle?: ArrowStyle;
  endStyle?: ArrowStyle;
}

export type LineObject = Required<GObject> & {
  x2: number,
  y2: number,
  width: number;
  beginStyle: ArrowStyle;
  endStyle: ArrowStyle;
}

export type ReactiveObject<O> = {
  [key in keyof O]: Reactive<O[key]>
}
export type ObjectController<O> = {
  data: ReactiveObject<O>;
  draw(): void;
}

export interface GraphicsObjects {
  line: LineObject,
  rect: RectObject,
  circle: CircleObject,
  text: TextObject,
}
export interface GraphicsMethods {
  line(opts: LineOptions): ObjectController<LineObject>;
  rect(opts: RectOptions): ObjectController<RectObject>;
  circle(opts: CircleOptions): ObjectController<CircleObject>;
  text(opts: TextOptions): ObjectController<TextObject>;
}

export interface Graphics extends GraphicsMethods {
  _offset_: ReactiveValue<XY>;
  _zoom_: ReactiveValue<XY>;
  clear(): void;
}

export function graphics(
  canvas: HTMLCanvasElement,
  _width_: Reactive<number>,
  _height_: Reactive<number>,
): Either<string, Graphics> {
  const ctx = canvas.getContext("2d")

  if (ctx === null) {
    return Either.left("Cannot create 2d context")
  }

  const _offset_ = Fluid.val<XY>({ x: 0, y: 0 })
  const _zoom_ = Fluid.val(1)

  const defaultFont = "Andale Mono"

  const scale = window.devicePixelRatio
  Fluid.listen(
    [_width_, _height_],
    (width, height) => {
      canvas.width = Math.floor(width * scale)
      canvas.height = Math.floor(height * scale)
      canvas.style.width = `${_width_}px`
      canvas.style.height = `${_height_}px`
    },
  )

  // Scale/unscale pixel
  const s = (px: number) => px * scale * Fluid.read(_zoom_)
  const us = (px: number) => px / scale / Fluid.read(_zoom_)

  // Apply offset
  const fx = (x: number) => x - Fluid.read(_offset_).x
  const fy = (y: number) => y - Fluid.read(_offset_).y

  // Composition
  const sfx = flow(fx, s)
  const sfy = flow(fy, s)

  function vectorDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
  }

  const reactiveObject = <V extends Record<string, unknown>>(obj: V): ReactiveObject<V> => {
    return Object
      .keys(obj)
      .reduce((_obj_, k) => {
        _obj_[k as keyof V] = Fluid.val(obj[k])
        return _obj_
      }, {} as ReactiveObject<V>)
  }

  /**
   * Apply all calculations to find target XY for painting
   * If null, it means it can't be painted (e.g. out of the reach)
   */

  function getCanvasXY({ x, y, relativeTo }: Pick<GObject, "x" | "y" | "relativeTo">): XY {
    if (relativeTo === "screen") {
      return { x: s(x), y: s(y) }
    } else if (relativeTo === "canvas") {
      return { x: sfx(x), y: sfy(y) }
    }

    return {
      x: s(x + relativeTo.x),
      y: s(y + relativeTo.y),
    }
  }

  const clear = () => {
    ctx.clearRect(0, 0, s(Fluid.read(_width_)), s(Fluid.read(_height_)))
  }

  const rect = (options: RectOptions): ObjectController<RectObject> => {
    const {
      x, y, width, height,
      color = "black", style = "fill",
      relativeTo = "canvas",
    } = options

    return {
      data: reactiveObject({
        x, y,
        width, height,
        color, style,
        relativeTo,
      }),
      draw() {
        ctx.save()
        ctx.beginPath()
        const xy = getCanvasXY({
          x: Fluid.read(this.data.x),
          y: Fluid.read(this.data.y),
          relativeTo: Fluid.read(this.data.relativeTo),
        })
        ctx.rect(xy.x, xy.y, s(width), s(height))

        if (style === "fill") {
          ctx.fillStyle = color
          ctx.fill()
        } else {
          ctx.strokeStyle = color
          ctx.stroke()
        }

        ctx.restore()
      },
    }
  }

  const circle = (options: CircleOptions): ObjectController<CircleObject> => {
    const {
      x, y, radius,
      color = "black", style = "fill",
      relativeTo = "canvas",
    } = options

    return {
      data: reactiveObject({
        x, y, radius,
        color, style,
        relativeTo,
      }),
      draw() {
        ctx.save()
        ctx.beginPath()
        const xy = getCanvasXY({
          x: Fluid.read(this.data.x),
          y: Fluid.read(this.data.y),
          relativeTo: Fluid.read(this.data.relativeTo),
        })
        ctx.arc(
          xy.x, xy.y, s(radius), 0, 2 * Math.PI,
        )
        if (style === "fill") {
          ctx.fillStyle = color
          ctx.fill()
        } else {
          ctx.strokeStyle = color
          ctx.stroke()
        }
        ctx.restore()
      },
    }
  }


  const getFontStyle = (fontSize: number, fontFamily: string) => `${fontSize * scale}px ${fontFamily}`

  const text = (options: TextOptions): ObjectController<TextObject> & {data: { metrics: ReactiveDerivation<TextMetrics> }} => {
    const {
      x, y, value,
      fontSize = 16, fontFamily = defaultFont, color = "black",
      relativeTo = "canvas",
    } = options

    const _value_ = Fluid.val(value)
    const _size_ = Fluid.val(fontSize)
    const _family_ = Fluid.val(fontFamily)
    const _font_ = Fluid.derive([_size_, _family_], (size, family) => getFontStyle(size, family))
    const _metrics_ = Fluid.derive([_font_, _value_], (font, value) => {
      ctx.save()
      ctx.font = font
      const metrics = ctx.measureText(value)
      ctx.restore()

      return metrics
    })

    return {
      data: {
        x: Fluid.val(x),
        y: Fluid.val(y),
        color: Fluid.val(color),
        relativeTo: Fluid.val(relativeTo),
        metrics: _metrics_,
        value: _value_,
        fontSize: _size_,
        fontFamily: _family_,
      },
      draw() {
        ctx.save()
        ctx.fillStyle = color
        ctx.font = Fluid.read(_font_)
        const xy = getCanvasXY({
          x: Fluid.read(this.data.x),
          y: Fluid.read(this.data.y),
          relativeTo: Fluid.read(this.data.relativeTo),
        })
        ctx.fillText(value, xy.x, xy.y)
        ctx.restore()
      },
    }
  }

  const arrow = (x1: number, y1: number, x2: number, y2: number, length: number) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const angle = Math.atan2(dy, dx)

    // Arrow
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - length * Math.cos(angle - Math.PI / 6), y2 - length * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - length * Math.cos(angle + Math.PI / 6), y2 - length * Math.sin(angle + Math.PI / 6))
    ctx.stroke()
  }

  const line = (options: LineOptions): ObjectController<LineObject> => {
    const {
      from, to,
      beginStyle = "none", endStyle = "none",
      width = 2, color = "black", relativeTo = "canvas",
    } = options

    return {
      data: reactiveObject({
        x: from.x, y: from.y,
        x2: to.x, y2: to.y,
        color,
        width,
        relativeTo,
        beginStyle,
        endStyle,
      }),
      draw() {
        const { data } = this
        const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = [
          getCanvasXY({ x: Fluid.read(data.x), y: Fluid.read(data.y), relativeTo: Fluid.read(data.relativeTo) }),
          getCanvasXY({ x: Fluid.read(data.x2), y: Fluid.read(data.y2), relativeTo: Fluid.read(data.relativeTo) }),
        ]
        const color = Fluid.read(this.data.color)
        const width = Fluid.read(this.data.width)

        // Line
        ctx.save()
        ctx.fillStyle = color
        ctx.strokeStyle = color
        ctx.lineWidth = s(width)
        const length = lazy(() => Math.min(vectorDistance(x1, y1, x2, y2) / 6, 30))

        ctx.beginPath()

        // small dot at the begginng
        if (beginStyle === "dot") {
          ctx.arc(x1, y1, s(3), 0, Math.PI * 2)
        } else if (beginStyle === "target") {
          arrow(x2, y2, x1, y1, length())
        }

        ctx.fillStyle = color
        ctx.strokeStyle = color
        ctx.fill()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        if (endStyle === "dot") {
          ctx.arc(x1, y1, s(3), 0, Math.PI * 2)
        } else if (endStyle === "target") {
          arrow(x1, y1, x2, y2, length())
        }

        ctx.restore()
      },
    }
  }

  return Either.right({
    // properties
    _offset_,
    _zoom_,

    // Methods
    rect,
    circle,
    text,
    line,

    clear,

  })
}

