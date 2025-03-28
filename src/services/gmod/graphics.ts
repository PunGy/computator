import { Either } from "../../lib/either"
import { Fluid, Reactive, ReactiveDerivation, ReactiveValue } from "reactive-fluid"
import { flow } from "../../lib/function"
import { lazy } from "../../lib/lazy"
import { vectorDistance } from "../../lib/vector"

export interface XY {
  x: number;
  y: number;
}

export interface GObjectOptions {
  x?: number;
  y?: number;
  color?: string;
  relativeTo?: "screen"|"canvas"|GObject_R;
}
export type GObject = Required<GObjectOptions> & {
  //absX: number,
  //absY: number,
  // width of circumscribed square
  frameX: number;
  // height of circumscribed square
  frameY: number;
}
export type GObject_R = {
  x: ReactiveValue<GObject["x"]>;
  y: ReactiveValue<GObject["y"]>;
  //absX: ReactiveDerivation<GObject["absX"]>;
  //absY: ReactiveDerivation<GObject["absY"]>;
  color: ReactiveValue<GObject["color"]>;
  relativeTo: ReactiveValue<GObject["relativeTo"]>;

  frameX: ReactiveDerivation<GObject["frameX"]>;
  frameY: ReactiveDerivation<GObject["frameY"]>;
}

export interface TextOptions extends GObjectOptions {
  value: string;

  fontFamily?: string;
  fontSize?: number;
}
export interface TextObject extends Required<TextOptions> {
  bottomY: number;
  value: string;
  // NOTE: values inside of metrics is scaled
  metrics: TextMetrics;
}
export interface TextObject_R extends GObject_R {
  bottomY: ReactiveDerivation<TextObject["bottomY"]>;
  value: ReactiveValue<TextObject["value"]>;
  metrics: ReactiveDerivation<TextObject["metrics"]>;
  fontFamily: ReactiveValue<TextObject["fontFamily"]>;
  fontSize: ReactiveValue<TextObject["fontSize"]>;
}

export type ShapeStyle = "fill" | "stroke"
export interface RectOptions extends GObjectOptions {
  width: number;
  height: number;
  style?: ShapeStyle;
}
export type RectObject = Required<RectOptions>
export interface RectObject_R extends GObject_R {
  width: ReactiveValue<RectObject["width"]>;
  height: ReactiveValue<RectObject["height"]>;
  style: ReactiveValue<RectObject["style"]>;
}

export interface CircleOptions extends GObjectOptions {
  radius: number;
  // width of the strokeLine
  width?: number;
  style?: "fill" | "stroke";
}
export type CircleObject = Required<CircleOptions>
export interface CircleObject_R extends GObject_R {
  // x0 and y0 - center of the circle
  x0: ReactiveDerivation<GObject["x"]>
  y0: ReactiveDerivation<GObject["y"]>
  width: ReactiveValue<CircleObject["width"]> ;
  radius: ReactiveValue<CircleObject["radius"]>;
  style: ReactiveValue<CircleObject["style"]>;
}

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
export interface LineObject_R extends GObject_R {
  x2: ReactiveValue<LineObject["x2"]>,
  y2: ReactiveValue<LineObject["y2"]>,
  width: ReactiveValue<LineObject["width"]>,
  beginStyle: ReactiveValue<LineObject["beginStyle"]>,
  endStyle: ReactiveValue<LineObject["endStyle"]>,
}

export type ObjectController<O> = {
  data: O;
  draw(): void;
}

export interface GraphicsObjects {
  line: LineObject_R,
  rect: RectObject_R,
  circle: CircleObject_R,
  text: TextObject_R,
}
export interface GraphicsMethods {
  line(opts: LineOptions): ObjectController<LineObject_R>;
  rect(opts: RectOptions): ObjectController<RectObject_R>;
  circle(opts: CircleOptions): ObjectController<CircleObject_R>;
  text(opts: TextOptions): ObjectController<TextObject_R>;
}

export interface Graphics extends GraphicsMethods {
  _offset_: ReactiveValue<XY>;
  _zoom_: ReactiveValue<number>;
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
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    },
    { immidiate: true },
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
      x: s(x + Fluid.read(relativeTo.x)),
      y: s(y + Fluid.read(relativeTo.y)),
    }
  }

  const clear = () => {
    ctx.clearRect(0, 0, s(Fluid.read(_width_)), s(Fluid.read(_height_)))
  }

  const rect = (options: RectOptions): ObjectController<RectObject_R> => {
    const {
      x = 0, y = 0, width, height,
      color = "black", style = "fill",
      relativeTo = "canvas",
    } = options
    const _width_ = Fluid.val(width)
    const _height_ = Fluid.val(height)

    return {
      data: {
        x: Fluid.val(x), y: Fluid.val(y),
        width: _width_, height: _height_,
        color: Fluid.val(color), style: Fluid.val(style),
        relativeTo: Fluid.val(relativeTo),
        frameX: _width_, frameY: _height_,
      },
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

  const circle = (options: CircleOptions): ObjectController<CircleObject_R> => {
    const {
      x = 0, y = 0, radius,
      width = 1, color = "black", style = "fill",
      relativeTo = "canvas",
    } = options
    const _r_ = Fluid.val(radius)
    const _r2_ = Fluid.derive(_r_, r => r * 2)

    const _x_ = Fluid.val(x)
    const _y_ = Fluid.val(y)

    const _x0_ = Fluid.derive([_x_, _r_], (x, r) => x + r)
    const _y0_ = Fluid.derive([_y_, _r_], (y, r) => y + r)

    return {
      data: {
        x: _x_, y: _y_, x0: _x0_, y0: _y0_, radius: _r_,
        width: Fluid.val(width),
        color: Fluid.val(color), style: Fluid.val(style),
        relativeTo: Fluid.val(relativeTo),
        frameX: _r2_, frameY: _r2_,
      },
      draw() {
        ctx.save()
        ctx.beginPath()
        const xy = getCanvasXY({
          x: Fluid.read(this.data.x0),
          y: Fluid.read(this.data.y0),
          relativeTo: Fluid.read(this.data.relativeTo),
        })
        ctx.arc(
          xy.x, xy.y, s(radius), 0, 2 * Math.PI,
        )
        if (style === "fill") {
          ctx.fillStyle = color
          ctx.fill()
        } else {
          ctx.lineWidth = Fluid.read(this.data.width)
          ctx.strokeStyle = color
          ctx.stroke()
        }
        ctx.restore()
      },
    }
  }


  const getFontStyle = (fontSize: number, fontFamily: string) => `${fontSize * scale}px ${fontFamily}`

  const text = (options: TextOptions): ObjectController<TextObject_R> => {
    const {
      x = 0, y = 0, value,
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
    const _frame_ = Fluid.derive(_metrics_, metrics => {
      return {
        x: us(metrics.width),
        y: us(metrics.actualBoundingBoxAscent),
      }
    })
    const _y_ = Fluid.val(y)
    const _bottomY_ = Fluid.derive([_frame_, _y_], (frame, y) => frame.y + y)

    return {
      data: {
        x: Fluid.val(x), y: _y_,
        bottomY: _bottomY_,
        color: Fluid.val(color),
        relativeTo: Fluid.val(relativeTo),
        metrics: _metrics_,
        value: _value_,
        fontSize: _size_, fontFamily: _family_,
        frameX: Fluid.derive(_frame_, f => f.x),
        frameY: Fluid.derive(_frame_, f => f.y),
      },
      draw() {
        ctx.save()
        ctx.fillStyle = color
        ctx.font = Fluid.read(_font_)
        const xy = getCanvasXY({
          x: Fluid.read(this.data.x),
          y: Fluid.read(this.data.bottomY),
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

  const line = (options: LineOptions): ObjectController<LineObject_R> => {
    const {
      from, to,
      beginStyle = "none", endStyle = "none",
      width = 2, color = "black", relativeTo = "canvas",
    } = options
    // TODO: frame calculation for a line
    const frame = Fluid.val(0)

    return {
      data: {
        x: Fluid.val(from.x), y: Fluid.val(from.y),
        x2: Fluid.val(to.x), y2: Fluid.val(to.y),
        color: Fluid.val(color),
        width: Fluid.val(width),
        relativeTo: Fluid.val(relativeTo),
        beginStyle: Fluid.val(beginStyle),
        endStyle: Fluid.val(endStyle),
        frameX: frame, frameY: frame,
      },
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

