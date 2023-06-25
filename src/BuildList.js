// Replace list copied from https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/
const _escText = text => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const _buildLink = ({id, text, children}, ul, flat, depth) => {
  let nestedList = ''

  if (children.length > 0) {
    if (flat) {
      nestedList = children.map(c => _buildLink(c, ul, flat, depth + 1))
    } else {
      nestedList = BuildList(children, ul, flat, depth + 1)
    }
  }

  if (id && text) {
   if (flat) {
      return `<li><a href="#${id}">${_escText(text)}</a></li>${(
        nestedList || []
      ).join('')}`
    } else {
      return `<li class="depth${depth}"><a href="#${id}">${_escText(text)}</a>${nestedList}</li>`
    }
  } else {
    return nestedList
  }

}

const BuildList = (listItems, ul, flat, depth = 0) => {
  const listType = ul ? 'ul' : 'ol'
  const list = listItems
    .sort((a, b) => a.order - b.order)
    .map(li => _buildLink(li, ul, flat, depth))

  return list.length > 0 ? `<${listType}>${list.join('')}</${listType}>` : ''
}

module.exports = BuildList
