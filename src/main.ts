import { Fluid } from "./lib/fluid.ts"

const _x_ = Fluid.val("x")
const _y_ = Fluid.val("y")

const _a_ = Fluid.derive(Fluid.combine(_x_, _y_), ([x, y]) => "a(" + x + y + ")")
//const _b_ = Fluid.derive(Fluid.combine(_x_, _y_), ([x, y]) => "b(" + x + y + ")")

console.log(Fluid.read(_a_))
Fluid.write(_x_, "X")
console.log(Fluid.read(_a_))

//Fluid.write(_x_, "X")
//
//console.log(Fluid.read(_a_))
//
//let answer
//Fluid.listen(
//  Fluid.combine(_a_, _b_),
//  ([a, b]) => answer = a + ", " + b,
//  { immidiate: true },
//)
//
//console.log("\n\nRESULT: " + answer)
////expect(Fluid.read(_a_)).toBe("a(xy)")
//
//Fluid.write(_x_, "[x]")
//
//console.log("\n\nRESULT: " + answer)
//
