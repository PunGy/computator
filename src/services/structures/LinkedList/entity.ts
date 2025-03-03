export class ListNode<T = unknown> {
  public value: T
  prev: ListNode<T> | null = null
  next: ListNode<T> | null = null

  constructor(value: T) {
    this.value = value
  }
}

export class LinkedList<T = unknown> {
  head: ListNode<T> | null = null
  tail: ListNode<T> | null = null
  length = 0

  /**
   * Push to tail
   */
  pushBack(val: T): T {
    if (!this.tail) {
      this.length = 1
      this.tail = this.head = new ListNode(val)
    } else {
      const node = new ListNode(val)

      node.prev = this.tail
      this.tail.next = node
      this.tail = node
      this.length++
    }

    return val
  }

  pushFront(val: T): T {
    if (!this.head) {
      this.length = 1
      this.tail = this.head = new ListNode(val)
    } else {
      const node = new ListNode(val)

      node.next = this.head
      this.head.prev = node
      this.head = node
      this.length++
    }

    return val
  }

  popBack(): T | null {
    if (!this.tail) {
      // If the list is empty, return null.
      return null
    }

    const value = this.tail.value

    if (this.head === this.tail) {
      this.head = this.tail = null
    } else {
      this.tail = this.tail.prev
      if (this.tail) {
        this.tail.next = null
      }
    }

    this.length--
    return value
  }

  popFront(): T | null {
    if (!this.head) {
      return null
    }

    const value = this.head.value

    if (this.head === this.tail) {
      this.head = this.tail = null
    } else {
      this.head = this.head.next
      if (this.head) {
        this.head.prev = null
      }
    }

    this.length--
    return value
  }
}
