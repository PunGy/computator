import { describe, it, expect, beforeEach } from "vitest"
import { LinkedList } from "./entity"

describe("LinkedList", () => {

  let list: LinkedList<number>

  beforeEach(() => {
    // Initializes the linked list before each test
    list = new LinkedList<number>()
  })

  it("should initially have length 0 and head and tail as null", () => {
    expect(list.length).toBe(0)
    expect(list.head).toBeNull()
    expect(list.tail).toBeNull()
  })

  describe("pushBack", () => {
    it("should add a single element to the list correctly", () => {
      list.pushBack(1)

      expect(list.length).toBe(1)
      expect(list.head?.value).toBe(1)
      expect(list.tail?.value).toBe(1)
      expect(list.head).toBe(list.tail) // Head and tail should be same
    })

    it("should add multiple elements to the back of the list", () => {
      list.pushBack(1)
      list.pushBack(2)
      list.pushBack(3)

      expect(list.length).toBe(3)
      expect(list.head?.value).toBe(1)
      expect(list.tail?.value).toBe(3)
      expect(list.head?.next?.value).toBe(2)
      expect(list.tail?.prev?.value).toBe(2)
    })
  })

  describe("pushFront", () => {
    it("should add a single element to the front correctly", () => {
      list.pushFront(1)
      expect(list.length).toBe(1)
      expect(list.head?.value).toBe(1)
      expect(list.tail?.value).toBe(1)
      expect(list.head).toBe(list.tail)
    })

    it("should add multiple elements to the front of the list", () => {
      list.pushFront(1)
      list.pushFront(2)
      list.pushFront(3)

      expect(list.length).toBe(3)
      expect(list.head?.value).toBe(3)
      expect(list.tail?.value).toBe(1)
      expect(list.head?.next?.value).toBe(2)
      expect(list.tail?.prev?.value).toBe(2)
    })
  })

  describe("popBack", () => {
    it("should return null when called on an empty list", () => {
      expect(list.popBack()).toBeNull()
      expect(list.length).toBe(0)
    })

    it("should remove and return a single element from the back of the list", () => {
      list.pushBack(1)
      const popped = list.popBack()

      expect(popped).toBe(1)
      expect(list.length).toBe(0)
      expect(list.head).toBeNull()
      expect(list.tail).toBeNull()
    })

    it("should remove and return multiple elements from the back of the list", () => {
      list.pushBack(1)
      list.pushBack(2)
      list.pushBack(3)

      const popped1 = list.popBack()
      expect(popped1).toBe(3)
      expect(list.length).toBe(2)
      expect(list.tail?.value).toBe(2)

      const popped2 = list.popBack()
      expect(popped2).toBe(2)
      expect(list.length).toBe(1)
      expect(list.tail?.value).toBe(1)

      const popped3 = list.popBack()
      expect(popped3).toBe(1)
      expect(list.length).toBe(0)
      expect(list.tail).toBeNull()
    })
  })

  describe("popFront", () => {
    it("should return null when called on an empty list", () => {
      expect(list.popFront()).toBeNull()
      expect(list.length).toBe(0)
    })

    it("should remove and return a single element from the front of the list", () => {
      list.pushFront(1)
      const popped = list.popFront()

      expect(popped).toBe(1)
      expect(list.length).toBe(0)
      expect(list.head).toBeNull()
      expect(list.tail).toBeNull()
    })

    it("should remove and return multiple elements from the front of the list", () => {
      list.pushFront(1)
      list.pushFront(2)
      list.pushFront(3)

      const popped1 = list.popFront()
      expect(popped1).toBe(3)
      expect(list.length).toBe(2)
      expect(list.head?.value).toBe(2)

      const popped2 = list.popFront()
      expect(popped2).toBe(2)
      expect(list.length).toBe(1)
      expect(list.head?.value).toBe(1)

      const popped3 = list.popFront()
      expect(popped3).toBe(1)
      expect(list.length).toBe(0)
      expect(list.head).toBeNull()
    })
  })

  describe("combination of operations", () => {
    it("should handle a mixture of push and pop operations correctly", () => {
      list.pushBack(1)
      list.pushBack(2)
      list.pushFront(0) // List: 0, 1, 2

      expect(list.head?.value).toBe(0)
      expect(list.tail?.value).toBe(2)
      expect(list.length).toBe(3)

      const poppedBack = list.popBack() // Removes 2
      expect(poppedBack).toBe(2)
      expect(list.tail?.value).toBe(1)
      expect(list.length).toBe(2)

      const poppedFront = list.popFront() // Removes 0
      expect(poppedFront).toBe(0)
      expect(list.head?.value).toBe(1)
      expect(list.length).toBe(1)

      list.pushFront(-1) // List: -1, 1
      expect(list.head?.value).toBe(-1)
      expect(list.tail?.value).toBe(1)
      expect(list.length).toBe(2)
    })
  })
})
