import { BuildTOC, ParseOptions } from "./toc.js";

export default (eleventyConfig, globalOpts) => {
  globalOpts = globalOpts || {};

  eleventyConfig.addFilter("toc", (content, localOpts) => {
    return BuildTOC(content, ParseOptions(localOpts, globalOpts));
  });
};