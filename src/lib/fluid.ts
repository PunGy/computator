/**
 * Reactive system libary
 */

/** Usage

const a = Fluid.val(10)

Fuild.read(a) // 10

Fluid.write(a, 20) // 20

const b = Fluid.derive(a, val => val + 10);

Fluid.read(b) // 30

Fluid.write(a, 30)
Fluid.read(b) // 40

const c = Fluid.derive(a, _a => Fluid.derive(b, _b => _a + _b))

Fluid.read(c) // 30 + 40 => 70

Fluid.listen(c, val => {
  console.log('c updated with: ', val)
})

Fluid.write(a, 0) // console.log( c updated with: 10 )

const name = Fluid.val("Max")
const surname = Fluid.val("Jacoblion")

const fullname = Fluid.derive(name, _name => Fluid.derive(surname, _surname => {
  // Skip when name is not Max
  if (_name !== "Max") {
    return Fluid.skip
  }
  return _name + " " + _surname
}))

Fluid.listen(fullname, (_fullname) => {
  console.log(_fullname)
})

Fluid.write(surname, "Yakovlev") // logs: Max Yakovlev
Fluid.write(name, "Mia") // nothing logged

Fluid.read(fullname) // Max Yakovlev

Fluid.write(surname, "JJ") // logs: Mia JJ
 */

/** API

Fluid
  - val: create a reactive value
  - read: read content of reactive value
  - write: write to reactive value
  - derive: make a deriviation of reactive value
            the result is DeriviationValue, which is immutable (cannot be used with write)
    - skip(TODO): special contant symbol for the derive value which indicates the computation might be ignored
  - listen: like `derive`, but proactive and returns "shutdown" as the result
 */


const _rVal = Symbol("r_val")
const _rDerive = Symbol("r_derive")

type Message = () => void;

export interface ReactiveValue<V> {
  __tag: typeof _rVal;
  listeners: Map<unknown, Message>;
}

export interface ReactiveDeriviation<V> {
  __tag: typeof _rDerive;
  listeners: Map<unknown, Message>;
}

export type Reactive<V> = ReactiveValue<V> | ReactiveDeriviation<V>

interface _ReactiveValue<V> extends ReactiveValue<V> {
  value: V;
}

interface _ReactiveDeriviation<V> extends ReactiveDeriviation<V> {
  _invalidate(): void;
  value(): V;
}


function isVal<V>(_value_: Reactive<V>): _value_ is _ReactiveValue<V> {
  return typeof _value_ === "object" && _value_ !== null && "__tag" in _value_ && _value_.__tag === _rVal
}
function isDerive<V>(_value_: Reactive<V>): _value_ is _ReactiveDeriviation<V> {
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
  listeners.forEach(message => {
    message()
  })
}

function expandValue<V>(_val_: ReactiveValue<V>): asserts _val_ is _ReactiveValue<V> {}
function expandDerive<V>(_derive_: ReactiveDeriviation<V>): asserts _derive_ is _ReactiveDeriviation<V> {}

const write = <V>(_value_: ReactiveValue<unknown>, newValue: V): ReactiveValue<V> => {
  expandValue(_value_)
  _value_.value = newValue
  notify(_value_.listeners)
  return _value_
}

type Unsub = () => void;
const listen = <V>(_reactive_: Reactive<V>, fn: (value: V) => void): Unsub => {
  function unsub() {
    _reactive_.listeners.delete(unsub)
  }
  _reactive_.listeners.set(unsub, () => fn(read(_reactive_)))

  return unsub
}

const nullCache = Symbol("nullCache")

const val = <V>(value: V): ReactiveValue<V> => ({
  __tag: _rVal,
  value,
  listeners: new Map(),
}) as _ReactiveValue<V>

const derive = <V, V2>(
  _value_: Reactive<V>,
  fn: (value: V) => V2 | ReactiveDeriviation<V2>,
): ReactiveDeriviation<V2> => {
  let cache: (typeof nullCache) | V2 = nullCache

  const derived: _ReactiveDeriviation<V2> = {
    __tag: _rDerive,
    _invalidate() {
      cache = nullCache
      notify(this.listeners)
    },
    listeners: new Map(),
    // @ts-expect-error some bullshit again
    value() {
      if (cache !== nullCache) {
        return cache
      }

      let result = fn(read(_value_))

      // @ts-expect-error fucking piece of crap
      while (isDerive(result)) {
        result.listeners.set(this, this._invalidate.bind(this))
        result = read(result)
      }

      cache = result as V2
      return result
    },
  }

  _value_.listeners.set(derived, derived._invalidate.bind(derived))

  return derived
}

export const Fluid = {
  val,
  derive,
  read,
  write,
  listen,
}

