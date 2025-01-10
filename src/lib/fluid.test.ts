import { describe, test, it, expect, vi } from "vitest"
import { Fluid } from "./fluid"

describe("Fluid", () => {
  describe("val", () => {
    it("creates a reactive value which can be readed", () => {
      const _a_ = Fluid.val(10)
      expect(Fluid.read(_a_)).toBe(10)
    })

    it("able to modify the value", () => {
      const _a_ = Fluid.val(10)
      Fluid.write(_a_, 20)
      expect(Fluid.read(_a_)).toBe(20)
    })
  })

  describe("derive", () => {
    it("creates deriviation based on the reactive val", () => {
      const _name_ = Fluid.val("Max")
      const _greet_ = Fluid.derive(_name_, name => "Hello, " + name)

      expect(Fluid.read(_greet_)).toBe("Hello, Max")
    })

    it("modifies the value of deriviation on external dependency change", () => {
      const _name_ = Fluid.val("Max")
      const _greet_ = Fluid.derive(_name_, name => "Hello, " + name)

      Fluid.write(_name_, "George")
      expect(Fluid.read(_greet_)).toBe("Hello, George")

      Fluid.write(_name_, "Cat")
      expect(Fluid.read(_greet_)).toBe("Hello, Cat")
    })

    it("caches result if dependency hasn't changed", () => {
      const _name_ = Fluid.val("Max")
      const calculation = vi.fn().mockImplementation((name: string) => "Hello, " + name)
      const _greet_ = Fluid.derive(_name_, calculation)
      Fluid.read(_greet_)
      Fluid.read(_greet_)
      Fluid.read(_greet_)

      expect(calculation).toHaveBeenCalledOnce()

      Fluid.write(_name_, "Cat")

      expect(Fluid.read(_greet_)).toBe("Hello, Cat")
      Fluid.read(_greet_)

      expect(calculation).toHaveBeenCalledTimes(2)
    })

    it("can have more than one dependency via currying", () => {
      const _name_ = Fluid.val("Max")
      const _surname_ = Fluid.val("Yakovlev")
      const _fullName_ = Fluid.derive([_name_, _surname_], (name, surname) => `${name} ${surname}`)

      expect(Fluid.read(_fullName_)).toBe("Max Yakovlev")

      Fluid.write(_name_, "George")
      expect(Fluid.read(_fullName_)).toBe("George Yakovlev")

      Fluid.write(_surname_, "Wachowsky")
      expect(Fluid.read(_fullName_)).toBe("George Wachowsky")
    })

    it("can have dozen of dependencies", () => {
      const _a_ = Fluid.val("a")
      const _b_ = Fluid.val("b")
      const _c_ = Fluid.val("c")
      const _d_ = Fluid.val("d")
      const _e_ = Fluid.val("e")

      const _sum_ = Fluid.derive([_a_, _b_, _c_, _d_, _e_], (a, b, c, d, e) => (
        a + b + c + d + e
      ))

      expect(Fluid.read(_sum_)).toBe("abcde")

      Fluid.write(_d_, "D")
      expect(Fluid.read(_sum_)).toBe("abcDe")
    })

    it("resolve race condition", () => {
      const _x_ = Fluid.val("x")
      const _X_ = Fluid.derive(_x_, x => x.toUpperCase())

      const _xX_ = Fluid.derive([_x_, _X_], (x, X) => x + X)

      expect(Fluid.read(_xX_)).toBe("xX")

      Fluid.write(_x_, "a")

      expect(Fluid.read(_xX_)).toBe("aA")
    })
  })

  describe("listen", () => {
    it("listen change of reactive value", () => {
      const _x_ = Fluid.val(10)
      const fn = vi.fn()

      Fluid.listen(_x_, fn)

      Fluid.write(_x_, 20)
      expect(fn).toHaveBeenCalledWith(20)
    })

    it("listen to multiple reactive values", () => {
      const _x_ = Fluid.val(10)
      const _y_ = Fluid.val(20)
      const fn = vi.fn()

      Fluid.listen([_x_, _y_], (x, y) => fn(x + y))

      Fluid.write(_x_, 20)
      expect(fn).toHaveBeenCalledWith(40)
    })

    it("listen change of reactive deriviation", () => {
      const _x_ = Fluid.val(10)
      const _y_ = Fluid.derive(_x_, x => x * 2)
      const fn = vi.fn()

      Fluid.listen(_y_, fn)

      Fluid.write(_x_, 20)
      expect(fn).toHaveBeenCalledWith(40)
    })
  })

  test("bunch", () => {
    const _x_ = Fluid.val("x")
    const _y_ = Fluid.val("y")

    const _a_ = Fluid.derive([_x_, _y_], (x, y) => "a(" + x + y + ")")
    const _b_ = Fluid.derive([_x_, _y_], (x, y) => "b(" + x + y + ")")

    let answer
    Fluid.listen(
      Fluid.derive([_a_, _b_], (a, b) => [a, b]),
      ([a, b]) => answer = a + ", " + b,
      { immidiate: true },
    )

    expect(answer).toBe("a(xy), b(xy)")
    expect(Fluid.read(_a_)).toBe("a(xy)")

    Fluid.write(_x_, "[x]")

    expect(answer).toBe("a([x]y), b([x]y)")
    expect(Fluid.read(_a_)).toBe("a([x]y)")
  })

  //describe("High-Order derives", () => {
  //  //it("reacts on _b_ only after change of _a_", () => {
  //  //  const _a_ = Fluid.val("a")
  //  //  const _b_ = Fluid.val("b")
  //  //  const fn = vi.fn()
  //  //
  //  //  Fluid.listen(_a_, a => {
  //  //    Fluid.write(_b_, Fluid.read(_b_) + a)
  //  //  })
  //  //
  //  //  const _c_ = Fluid.derive(_a_, () => {
  //  //    return Fluid.read(Fluid.derive(_b_, b => b))
  //  //  })
  //  //
  //  //  Fluid.listen(_c_, fn, { immidiate: true })
  //  //
  //  //  expect(fn).toBeCalledWith("b")
  //  //
  //  //  fn.mockClear()
  //  //
  //  //  Fluid.write(_b_, "B")
  //  //
  //  //  expect(fn).not.toHaveBeenCalled()
  //  //  expect(Fluid.read(_c_)).toBe("b")
  //  //
  //  //  Fluid.write(_a_, "A")
  //  //
  //  //  expect(fn).toBeCalledWith("AB")
  //  //  expect(Fluid.read(_c_)).toBe("AB")
  //  //})
  //})
})

