const _left = Symbol("left")
const _right = Symbol("right")

export interface Left<L> {
  __tag: typeof _left;
  left: L;
}
export interface Right<R> {
  __tag: typeof _right;
  right: R;
}
export type Either<L, R> = Left<L> | Right<R>

export const left = <L>(value: L) => ({
  __tag: _left,
  left: value,
})
export const right = <R>(value: R): Right<R> => ({
  __tag: _right,
  right: value,
})

export const Either = {
  left,
  right,
}

