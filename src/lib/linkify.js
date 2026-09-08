const URL_REGEX = /(https?:\/\/[^\s]+)/g

export function linkifyParts(text) {
  if (!text) return []
  const parts = text.split(URL_REGEX)
  return parts.map((part, i) => {
    if (part.match(URL_REGEX)) {
      return { type: 'link', value: part, key: i }
    }
    return { type: 'text', value: part, key: i }
  })
}
