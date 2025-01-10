/**
 * Reactive system libary
 */

/** API
Fluid
  - val: create a reactive value
  - read: read content of reactive value
  - write: write to reactive value
  - derive: make a deriviation of reactive value
            the result is DeriviationValue, which is immutable (cannot be used with write)
  - listen: like `derive`, but proactive and returns "shutdown" as the result
 */


const _rVal = Symbol("r_val")
const _rDerive = Symbol("r_derive")

type Message = () => void;

export interface ReactiveValue<V> {
  __tag: typeof _rVal;
  listeners: Map<unknown, Message>;
}

export interface ReactiveDerivation<V> {
  __tag: typeof _rDerive;
  listeners: Map<unknown, Message>;
}

export type Reactive<V = unknown> = ReactiveValue<V> | ReactiveDerivation<V>

interface _ReactiveValue<V> extends ReactiveValue<V> {
  value: V;
}

interface _ReactiveDerivation<V> extends ReactiveDerivation<V> {
  _invalidate(): void;
  value(): V;
}

function isVal<V>(_value_: Reactive<V>): _value_ is _ReactiveValue<V>
function isVal(smth: unknown): false
function isVal<V>(_value_: Reactive<V> | any): _value_ is _ReactiveValue<V> {
  return typeof _value_ === "object" && _value_ !== null && "__tag" in _value_ && _value_.__tag === _rVal
}
function isDerive<V>(_value_: Reactive<V>): _value_ is _ReactiveDerivation<V>
function isDerive(smth: unknown): false
function isDerive<V>(_value_: Reactive<V> | any): _value_ is _ReactiveDerivation<V> {
  return typeof _value_ === "object" && _value_ !== null && "__tag" in _value_ && _value_.__tag === _rDerive
}

const read = <V>(_reactive_: Reactive<V>): V => {
  if (isVal(_reactive_)) {
    return _reactive_.value
  }
  if (isDerive(_reactive_)) {
    return _reactive_.value()
  }

  throw new Error("Wrong usage of Fluid.read: non-reactive entity was passed")
}

const notify = (listeners: Map<unknown, Message>) => {
  listeners.forEach((message) => {
    message()
  })
}

const write = <V>(_value_: ReactiveValue<unknown>, newValue: V): ReactiveValue<V> => {
  (_value_ as _ReactiveValue<V>).value = newValue
  notify(_value_.listeners)
  return _value_
}

type Unsub = () => void;

type ListenProps = {
  immidiate?: boolean;
}

function listen<V>(
  _reactive_: Reactive<V>,
  fn: (value: V) => void,
  props?: ListenProps
): Unsub
function listen<Vs extends any[]>(
  _reactive_: { [K in keyof Vs]: Reactive<Vs[K]> },
  fn: (...values: Vs) => void,
  props?: ListenProps,
): Unsub
function listen<V>(
  _reactive_: Reactive<V> | Reactive<any>[],
  fn: ((value: V) => void) | ((...values: any[]) => void),
  props?: ListenProps,
): Unsub {
  const sources = Array.isArray(_reactive_) ? _reactive_ : [_reactive_]

  function unsub() {
    sources.forEach( source => source.listeners.delete(unsub))
  }
  const react = () => sources.length > 1
    ? (fn as (...values: any[]) => void)(...sources.map(source => read(source)))
    : fn(read(sources[0]))

  sources.forEach(source => source.listeners.set(unsub, react))

  if (props?.immidiate) {
    react()
  }

  return unsub
}

//////////////
// Values
//////////////

const nullCache = Symbol("nullCache")

const val = <V>(value: V): ReactiveValue<V> => ({
  __tag: _rVal,
  value,
  listeners: new Map(),
}) as _ReactiveValue<V>

function derive<V, V2>(
  _value_: Reactive<V>,
  fn: (value: V) => V2,
): ReactiveDerivation<V2>
function derive<Vs extends any[], V2>(
  _values_: { [K in keyof Vs]: Reactive<Vs[K]> },
  fn: (...values: Vs) => V2
): ReactiveDerivation<V2>;
function derive<V, V2>(
  _v_: Reactive<V> | Reactive<any>[],
  fn: ((value: V) => V2) | ((...values: any[]) => V2),
): ReactiveDerivation<V2> {
  let cache: (typeof nullCache) | V2 = nullCache

  const sources = Array.isArray(_v_) ? _v_ : [_v_]

  const derived: _ReactiveDerivation<V2> = {
    __tag: _rDerive,
    _invalidate() {
      cache = nullCache
      notify(this.listeners)
    },
    listeners: new Map(),
    value() {
      if (cache !== nullCache) {
        return cache
      }

      const result = sources.length > 1
        ? (fn as ((...values: any[]) => V2))(...sources.map(_reactive_ => read(_reactive_)))
        : fn(read(sources[0]))

      cache = result as V2
      return result
    },
  }

  sources.forEach(source => source.listeners.set(derived, derived._invalidate.bind(derived)))

  return derived
}

export const Fluid = {
  val,
  derive,
  read,
  write,
  listen,
}

