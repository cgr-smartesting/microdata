export function microdataAll(itemtype: string, scope: Element) {
  const itemScopes = scope.querySelectorAll(
    `[itemscope][itemtype="${itemtype}"]`
  )
  return [...itemScopes].map(extract)
}

export function microdata(itemtype: string, scope: Element) {
  const itemScope = scope.querySelector(`[itemscope][itemtype="${itemtype}"]`)
  return itemScope === null ? null : extract(itemScope)
}

function extract(scope: Element): any {
  const itemType = scope.getAttribute('itemtype')!
  const microdata = { '@type': new URL(itemType).pathname.slice(1) }
  const children = [...scope.children]
  let child: Element | undefined = undefined

  while ((child = children.shift())) {
    const key = child.getAttribute('itemprop')
    if (key) {
      add(microdata, key, value(child))
    }
    if (child.getAttribute('itemscope') === null)
      prepend(children, child.children)
  }

  return microdata
}

function add(microdata: any, key: string, value: any) {
  if (value === null) return

  const prop = microdata[key]
  if (prop == null) microdata[key] = value
  else if (Array.isArray(prop)) prop.push(value)
  else microdata[key] = [prop, value]
}

function value(element: Element) {
  if (element.getAttribute('itemscope') !== null) return extract(element)
  const attributeName = lookup[element.tagName.toLowerCase()]
  const rawStringValue = attributeName
    ? element.getAttribute(attributeName)
    : element.textContent
  const stringValue = rawStringValue
    .trim()
    .split(/\n/)
    .map(s => s.trim())
    .join(' ')
  const itemType = element.getAttribute('itemtype')
  switch (itemType) {
    case null:
      return stringValue
    case 'http://schema.org/Text':
      return stringValue
    case 'http://schema.org/Integer':
      return Number(stringValue)
    case 'http://schema.org/Boolean':
      return Boolean(stringValue)
    default:
      throw new Error(
        `Unable to parse element with itemtype '${itemType}' (itemprop="${element.getAttribute(
          'itemprop'
        )}")`
      )
  }
}

function prepend(target: Element[], addition: HTMLCollection) {
  ;[].unshift.apply(target, [].slice.call(addition))
}

const lookup: { [key: string]: string } = {
  meta: 'content',
  audio: 'src',
  embed: 'src',
  iframe: 'src',
  img: 'src',
  source: 'src',
  video: 'src',
  a: 'href',
  area: 'href',
  link: 'href',
  object: 'data',
  time: 'datetime',
}
