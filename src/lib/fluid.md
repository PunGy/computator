Example usage:

```typescript
import { Fluid, ReactiveValue } from "./lib/fluid.ts"

type Item = {price: number, id: number}
const _cartItems_: ReactiveValue<Map<number, Item>> = Fluid.val(new Map())

let persistentId = 0
const addToCart = (item: Item) => Fluid.write(_cartItems_, items => {
  items.set(item.id, item)
  return items
})

const removeFromCart = (id: number) => Fluid.write(_cartItems_, items => {
  items.delete(id)
  return items
})

const _totalPrice_ = Fluid.derive(
  _cartItems_,
  items => Array.from(items.values()).reduce((sum, item) => sum + item.price, 0),
)

const _discountedPrice_ = Fluid.derive(
  _totalPrice_,
  price => price > 100 ? price * 0.9 : price,
)

const priceField = document.getElementById("priceField") as HTMLInputElement
document.getElementById("add")?.addEventListener(
  "click",
  () => {
    const price = parseInt(priceField.value, 10)
    addToCart({ price, id: persistentId++ })
    priceField.value = ""
  },
)

const totalPriceEl = document.getElementById("totalPrice") as HTMLSpanElement
const discountPriceEl = document.getElementById("discountPrice") as HTMLSpanElement
const listEl = document.getElementById("list") as HTMLDivElement

listEl.addEventListener("click", (e) => {
  const elId = e.target?.id
  if (elId && elId.startsWith("item")) {
    const id = parseInt(elId.slice("item-".length), 10)
    removeFromCart(id)
  }
})

Fluid.listen(
  _cartItems_,
  items => {
    listEl.innerHTML = Array.from(items.values())
      .reduce((acc, item) => acc += `<p id="item-${item.id}">[${item.id}]: ${item.price}</p>`, "")
  },
)
Fluid.listen(
  _totalPrice_,
  price => totalPriceEl.innerText = price.toString(),
)
Fluid.listen(
  _discountedPrice_,
  price => discountPriceEl.innerText = price.toString(),
)

```
