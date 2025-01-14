import { load } from "cheerio";

const defaults = {
  tags: ["h2", "h3", "h4"],
  wrapper: "nav",
  wrapperClass: "toc",
  wrapperLabel: undefined,
  ul: true,
  flat: false,
};

export function BuildTOC(text, opts) {
  const { tags, wrapper, wrapperClass, wrapperLabel, ul, flat } = ParseOptions(opts, defaults);

  if (text == undefined) {
  	console.log("Cannot build TOC. `content` is empty.");
  	return undefined;
  }

  const $ = load(text);

  const headings = NestHeadings(tags, $);

  if (headings.length === 0) {
  	console.log("Cannot build TOC. No headers found in `content`.");
  	return undefined;
  }

  const label = wrapperLabel ? `aria-label="${wrapperLabel}"` : "";

  return wrapper
    ? `<${wrapper} class="${wrapperClass}" ${label}>
        ${BuildList(headings, ul, flat)}
      </${wrapper}>`
    : BuildList(headings, ul, flat, wrapperClass);  
}

export function ParseOptions(userOptions, defaultOptions) {
  let safeDefaultOptions = {};
  let safeUserOptions = {};

  if (defaultOptions && defaultOptions.constructor === {}.constructor) {
    safeDefaultOptions = defaultOptions;
  }

  if (userOptions && typeof userOptions === "string") {
    try {
      safeUserOptions = JSON.parse(userOptions);
    } catch (e) { }
  } else if (userOptions && userOptions.constructor === {}.constructor) {
    safeUserOptions = userOptions;
  }

  return Object.assign({}, safeDefaultOptions, safeUserOptions);
}

// Replace list copied from https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/
const _escText = (text) => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const _buildLink = ({ id, text, children }, ul, flat, depth) => {
  let nestedList = "";

  if (children.length > 0) {
    if (flat) {
      nestedList = children.map((c) => _buildLink(c, ul, flat, depth + 1));
    } else {
      nestedList = BuildList(children, ul, flat, depth + 1);
    }
  }

  if (id && text) {
    if (flat) {
      return `<li class="depth${depth}"><a href="#${id}">${_escText(
        text
      )}</a></li>${(nestedList || []).join("")}`;
    } else {
      return `<li class="depth${depth}"><a href="#${id}">${_escText(
        text
      )}</a>${nestedList}</li>`;
    }
  } else {
    return nestedList;
  }
};

function BuildList(listItems, ul, flat, wrapperClass, depth = 0) {
  const listType = ul ? "ul" : "ol";
  const list = listItems
    .sort((a, b) => a.order - b.order)
    .map((li) => _buildLink(li, ul, flat, depth));

  return list.length > 0
    ? `<${listType} class="${wrapperClass}">${list.join("")}</${listType}>`
    : "";
};

function NestHeadings(tags, $) {
  const temp = {};

  tags.forEach((t) => {
    temp[t] = SimplifyResults(t, tags, $);
  });

  const headings = [];

  Object.keys(temp)
    .reverse()
    .filter((t) => temp[t].length > 0)
    .map((k) => {
      const index = tags.indexOf(k);

      temp[k].map((h) => {
        let parent = headings;

        if (index > 0) {
          const potentialParent = temp[tags[index - 1]].find((p) => {
            return p.id === h.parent;
          });

          if (potentialParent && "children" in potentialParent) {
            parent = potentialParent.children;
          }
        }

        parent.push(h);
      });
    });

  return headings;
}

function SimplifyResults(tag, tags, $) {
  const results = [];

  $(`${tag}[id]`).each((i, el) => {
    const tag = el.name;
    const id = $(el).attr("id");
    const text = $(el).text().replace(" #", "");
    const hierarchy = tags.indexOf(tag);
    const parent =
      hierarchy > 0 &&
      $(el)
        .prevAll(tags[hierarchy - 1])
        .attr("id");

    results.push({
      order: i,
      tag,
      id,
      text,
      parent,
      children: [],
    });
  });

  return results;  
}
