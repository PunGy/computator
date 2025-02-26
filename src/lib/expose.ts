export function expose(key: string, obj: unknown) {
  // @ts-expect-error ignore
  window[key] = obj
}
