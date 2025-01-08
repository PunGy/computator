import { describe, it, expect, vi } from "vitest"
import { Fluid } from "./fluid"

describe("Fluid", () => {
  describe("val", () => {
    it("creates a reactive value which can be readed", () => {
      const a = Fluid.val(10)
      expect(Fluid.read(a)).toBe(10)
    })

    it("able to modify the value", () => {
      const a = Fluid.val(10)
      Fluid.write(a, 20)
      expect(Fluid.read(a)).toBe(20)
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
      const _fullName_ = Fluid.derive(_name_, name => Fluid.derive(_surname_, surname => `${name} ${surname}`))

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

      const _sum_ = Fluid.derive(_a_, a => (
        Fluid.derive(_b_, b => (
          Fluid.derive(_c_, c => (
            Fluid.derive(_d_, d => (
              Fluid.derive(_e_, e => (
                a + b + c + d + e
              ))
            ))
          ))
        ))
      ))

      expect(Fluid.read(_sum_)).toBe("abcde")

      Fluid.write(_d_, "D")
      expect(Fluid.read(_sum_)).toBe("abcDe")
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


    it("listen change of reactive deriviation", () => {
      const _x_ = Fluid.val(10)
      const _y_ = Fluid.derive(_x_, x => x * 2)
      const fn = vi.fn()

      Fluid.listen(_y_, fn)

      Fluid.write(_x_, 20)
      expect(fn).toHaveBeenCalledWith(40)
    })
  })
})

