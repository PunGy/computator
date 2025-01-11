import { Either } from "./either"
import { Fluid, Reactive, ReactiveValue } from "./fluid"
interface XY {
  x: number;
  y: number;
}

interface GObject {
  x: number;
  y: number;
  color?: string;
  relativeTo?: "screen"|"canvas";
}

interface TextOptions extends GObject {
  value: string;
  align?: "left" | "center" | "right";
  fontSize?: number;
}


interface WithText {
  text?: string;
  textColor?: string;
  fontSize?: number;
}

interface TextObject extends GObject {
  value: string;
  metrics: TextMetrics;
  fontSize: number;
  align: NonNullable<TextOptions["align"]>;
}

type ShapeStyle = "fill" | "stroke"

interface RectProps extends GObject, WithText {
  width?: number;
  height?: number;
  style?: ShapeStyle;
}
interface RectObject extends GObject {
  width: number;
  height: number;
  style: ShapeStyle;
  textObject?: TextObject;
}

interface CircleOptions extends GObject, WithText {
  radius: number;
  style: "fill" | "stroke";
}

interface CircleObject extends GObject {
  radius: number;
  textObject?: ShapeStyle;
}

interface LineOptions extends Omit<GObject, "x" | "y"> {
  color: string;
  from: XY;
  to: XY;
  width?: number;
}
interface LineObject {
  from: XY;
  to: XY;
  color: string;
  width: number;
}

type ArrowStyle = "target" | "none";

interface ArrowOptions extends LineOptions {
  beginStyle?: ArrowStyle;
  endStyle?: ArrowStyle;
}
interface ArrowObject extends LineObject {
  beginStyle: ArrowStyle;
  endStyle: ArrowStyle;
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
  const s = (px: number) => px * scale
  const us = (px: number) => px / scale

  // Apply offset
  const fx = (x: number) => x - Fluid.read(_offset_).x
  const fy = (y: number) => y - Fluid.read(_offset_).y
}

