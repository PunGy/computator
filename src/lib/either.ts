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

const left = <L>(value: L): Left<L> => ({
  __tag: _left,
  left: value,
})
const right = <R>(value: R): Right<R> => ({
  __tag: _right,
  right: value,
})

function isLeft<L, R>(either: Either<L, R>): either is Left<L> {
  return either.__tag === _left
}
function isRight<L, R>(either: Either<L, R>): either is Right<R> {
  return either.__tag === _right
}

function sequence<L, R>(seq: Array<Either<L, R>>): Either<L, Array<R>> {
  const res: Array<R> = []
  for (const r of seq) {
    if (isLeft(r)) {
      return r
    }
    res.push(r.right)
  }
  return right(res)
}

const map = <R2, L, R>(fn: (a: R) => R2) => (either: Either<L, R>): Either<L, R2> => {
  return isRight(either) ? right(fn(either.right)) : either
}

const bind = <R2, L, R>(fn: (a: R) => Either<L, R2>) => (either: Either<L, R>): Either<L, R2> => {
  return isRight(either)
    ? fn(either.right)
    : either
}

export const Either = {
  // Entities
  left,
  right,

  // Operations
  map,
  bind,
  sequence,
}

