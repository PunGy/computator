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

export const Maybe = {
  some,
  none,
}

