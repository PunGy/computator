import { Either } from "./either"
import { Fluid, Reactive, ReactiveValue } from "./fluid"
import { flow } from "./function";

interface XY {
  x: number;
  y: number;
}

interface GObjectOptions extends XY {
  color?: string;
  relativeTo?: "screen"|"canvas"|GObjectOptions;
}
type GObject = Required<GObjectOptions>

interface TextOptions extends GObjectOptions {
  value: string;

  fontStyle?: string;
  fontSize?: number;
}
interface TextObject extends Required<TextOptions> {
  value: string;
  metrics: TextMetrics;
  //align: Required<TextOptions["align"]>;
}

type ShapeStyle = "fill" | "stroke"
interface RectOptions extends GObjectOptions {
  width: number;
  height: number;
  style?: ShapeStyle;
}
type RectObject = Required<RectOptions>

interface CircleOptions extends GObjectOptions {
  radius: number;
  style: "fill" | "stroke";
}
type CircleObject = Required<CircleOptions>

interface LineOptions extends Omit<GObjectOptions, "x" | "y"> {
  color: string;
  from: XY;
  to: XY;
  width?: number;
}

type LineObject = Required<LineOptions>

type ArrowStyle = "target" | "none";

interface ArrowOptions extends LineOptions {
  beginStyle?: ArrowStyle;
  endStyle?: ArrowStyle;
}

type ArrowObject = Required<ArrowOptions>

type ObjectController<O extends GObject> = {
  info: O;
  draw(): void;
}

export function graphics(
  canvas: HTMLCanvasElement,
  _width_: Reactive<number>,
  _height_: Reactive<number>,
) {
  const ctx = canvas.getContext("2d")

  if (ctx === null) {
    return Either.left("Cannot create 2d context")
  }

  const _offset_ = Fluid.val<XY>({ x: 0, y: 0 })
  const _zoom_ = Fluid.val(1)

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

  /**
   * Apply all calculations to find target XY for painting
   * If null, it means it can't be painted (e.g. out of the reach)
   */
  const ctxCoordiantes = (xy: XY, relative: GObject["relativeTo"]): XY | null => {
    if ()
  }

  const clear = () => {
    ctx.clearRect(0, 0, s(Fluid.read(_width_)), s(Fluid.read(_height_)))
  }

  const rect = (options: RectOptions): ObjectController<RectObject> => {
    const {
      x, y, width, height,
      color = "black", style = "fill",
      relativeTo,
    } = options

    return {
      info: {
        x, y,
        width, height,
        color, style,
      },
      draw() {
        ctx.save()
        ctx.beginPath()
        ctx.rect(
          normalizeXFor(this.info, props.screenRelative),
          normalizeYFor(this.info, props.screenRelative),
          s(width),
          s(height),
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

  return {
    // properties
    _offset_,

    // methods
    clear,
  }
}

