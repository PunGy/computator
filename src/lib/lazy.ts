const notCached = Symbol("notCached")

export const lazy = <V>(val: () => V) => {
  let cache: V | typeof notCached = notCached

  return () => {
    if (cache === notCached) {
      cache = val()
    }
    return cache
  }
}
