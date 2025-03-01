const _some = Symbol("some")
const _none = Symbol("none")

export interface Some<V> {
  __tag: typeof _some;
  value: V,
}
export interface None {
  __tag: typeof _none;
}
export type Maybe<V> = Some<V> | None

const some = <V>(value: V): Some<V> => ({
  __tag: _some,
  value,
})

const none: None = {
  __tag: _none,
}

const fromNullable = <V>(value: V):
  V extends null
  ? None
  : V extends undefined
    ? None
    : Some<NonNullable<V>> => {
  // @ts-expect-error another bullshit
  return value == null ? none : some(value)
}

export const Maybe = {
  some,
  none,

  fromNullable,
}

