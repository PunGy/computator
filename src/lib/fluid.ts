/**
 * Reactive system libary
 */

import { NonEmptyArray } from "./array"
import { SparseArray } from "./sparseArray"

//////////////
// Utilities
/////////////

// Utilities // Priorities

const _rVal = Symbol("r_val")
const _rDerive = Symbol("r_derive")

type Message = () => void;

// Lower number - Highest priority
type Priority = number | typeof priorities.lowest

const priorities = {
  lowest: Symbol("lowest"),
  highest: 0,
  before(_derived_: ReactiveDerivation<unknown>) {
    const { priority, listeners } = (_derived_ as _ReactiveDerivation<unknown>)
    return priority === this.lowest ? listeners.lastIndex : (priority as number) - 1
  },
  after(_derived_: ReactiveDerivation<unknown>) {
    const priority = (_derived_ as _ReactiveDerivation<unknown>).priority
    return priority === this.lowest ? priority : (priority as number) + 1
  },
}

class PriorityPool extends SparseArray<Map<unknown, Message>> {
  push(value: Map<unknown, Message>, index7?: number | typeof priorities.lowest): Map<unknown, Message> {
    if (index7 === priorities.lowest) {
      return this.lowest = value
    }
    return super.push(value, index7 as number)
  }
  get(index: number | typeof priorities.lowest): Map<unknown, Message> | undefined {
    if (index === priorities.lowest) {
      return this.lowest
    }
    return super.get(index as number)
  }
  getOrMake(index: number | typeof priorities.lowest): Map<unknown, Message> {
    let pool = this.get(index)
    if (pool === undefined) {
      pool = new Map()
      this.push(pool, index)
    }
    return pool
  }
  lowest: Map<unknown, Message> | undefined

  forEach(fn: (arg: Map<unknown, Message>, index: number) => void): void {
    super.forEach(fn)
    if (this.lowest) {
      fn(this.lowest, Infinity)
    }
  }
}

// Utilities // Reactivity types

export interface ReactiveValue<V> {
  __tag: typeof _rVal;
  listeners: PriorityPool;
}

export interface ReactiveDerivation<V> {
  __tag: typeof _rDerive;
  listeners: PriorityPool;
}

export type Reactive<V = unknown> = ReactiveValue<V> | ReactiveDerivation<V>

interface _ReactiveValue<V> extends ReactiveValue<V> {
  value: V;
}

interface _ReactiveDerivation<V> extends ReactiveDerivation<V> {
  _invalidate(): void;
  _cache: (typeof nullCache) | V;
  priority: Priority;
  value(): V;
}

// Utilities // Helpers

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

const notify = (listeners: PriorityPool) => {
  listeners.forEach((pool) => {
    pool.forEach(message => {
      message()
    })
  })
}

// Utilities // Operations

const read = <V>(_reactive_: Reactive<V>): V => {
  if (isVal(_reactive_)) {
    return _reactive_.value
  }
  if (isDerive(_reactive_)) {
    return _reactive_.value()
  }

  throw new Error("Wrong usage of Fluid.read: non-reactive entity was passed")
}

const write = <A, B>(_value_: ReactiveValue<A>, newValue: B | ((aVal: A) => B)): ReactiveValue<B> => {
  (_value_ as _ReactiveValue<B>).value = typeof newValue === "function"
    ? (newValue as ((aVal: A) => B))(read(_value_))
    : newValue
  notify(_value_.listeners)
  return _value_
}

///////////////////////
// Reactive Structures
///////////////////////


// Reactive // val

const val = <V>(value: V): ReactiveValue<V> => ({
  __tag: _rVal,
  value,
  listeners: new PriorityPool(),
}) as _ReactiveValue<V>


// Reactive // derive

interface DeriveProps {
  priority?: Priority
}

const nullCache = Symbol("nullCache")

function derive<V, V2>(
  _value_: Reactive<V>,
  fn: (value: V) => V2,
  props?: DeriveProps,
): ReactiveDerivation<V2>
// @ts-expect-error TS does not support high-order types
function derive<Vs extends NonEmptyArray<any>, V2>(
  _values_: { [K in keyof Vs]: Reactive<Vs[K]> },
  fn: (...values: Vs) => V2,
  props?: DeriveProps,
): ReactiveDerivation<V2>;
function derive<V, V2>(
  _v_: Reactive<V> | NonEmptyArray<Reactive<any>>,
  fn: ((value: V) => V2) | ((...values: any[]) => V2),
  props?: DeriveProps,
): ReactiveDerivation<V2> {
  const sources = Array.isArray(_v_) ? _v_ : [_v_] as NonEmptyArray<Reactive<V>>

  const derived: _ReactiveDerivation<V2> = {
    __tag: _rDerive,
    _invalidate() {
      this._cache = nullCache
      notify(this.listeners)
    },
    _cache: nullCache,
    priority: props?.priority ?? priorities.highest,
    listeners: new PriorityPool(),
    value() {
      if (this._cache !== nullCache) {
        return this._cache
      }

      const result = sources.length > 1
        ? (fn as ((...values: any[]) => V2))(...sources.map(_reactive_ => read(_reactive_)))
        : fn(read(sources[0]))

      this._cache = result as V2
      return result
    },
  }

  sources.forEach(source => {
    const pool = source.listeners.getOrMake(derived.priority)
    pool.set(derived, derived._invalidate.bind(derived))
  })

  return derived
}

// Reactive // listener

type Unsub = () => void;

interface ListenProps extends DeriveProps {
  immidiate?: boolean;
}

function listen<V>(
  _reactive_: Reactive<V>,
  fn: (value: V) => void,
  props?: ListenProps
): Unsub
// @ts-expect-error TS does not support high-order types
function listen<Vs extends NonEmptyArray<any>>(
  _reactive_: { [K in keyof Vs]: Reactive<Vs[K]> },
  fn: (...values: Vs) => void,
  props?: ListenProps,
): Unsub
function listen<V>(
  _reactive_: Reactive<V> | NonEmptyArray<Reactive<any>>,
  fn: ((value: V) => void) | ((...values: any[]) => void),
  props?: ListenProps,
): Unsub {
  const sources: NonEmptyArray<Reactive<V>> = Array.isArray(_reactive_) ? _reactive_ : [_reactive_]

  function unsub() {
    sources.forEach( source => {
      const pool = source.listeners.getOrMake(props?.priority ?? priorities.highest)
      pool.delete(unsub)
    })
  }
  const react = () => sources.length > 1
    ? (fn as (...values: any[]) => void)(...sources.map(source => read(source)))
    : fn(read(sources[0]))

  sources.forEach(source => {
    const pool = source.listeners.getOrMake(props?.priority ?? priorities.highest)
    pool.set(unsub, react)
  })

  if (props?.immidiate) {
    react()
  }

  return unsub
}

export const Fluid = {
  val,
  derive,
  read,
  write,
  listen,

  priorities,
}

