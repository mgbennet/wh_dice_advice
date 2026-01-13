import * as d3 from "d3";

export function smallCirclePattern(backgroundColor?: string) {
  const widthHeight = 8;
  const radius = 1;
  const color = "#0009";
  const pattern = d3.create("svg:pattern")
    .attr("id", "circle-hatch")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", widthHeight)
    .attr("height", widthHeight);
  pattern.append("circle")
    .attr("cx", widthHeight / 2)
    .attr("cy", 0)
    .attr("r", radius)
    .attr("fill", color);
  pattern.append("circle")
    .attr("cx", 0)
    .attr("cy", widthHeight / 2)
    .attr("r", radius)
    .attr("fill", color);
  pattern.append("circle")
    .attr("cx", widthHeight)
    .attr("cy", widthHeight / 2)
    .attr("r", radius)
    .attr("fill", color);
  pattern.append("circle")
    .attr("cx", widthHeight / 2)
    .attr("cy", widthHeight)
    .attr("r", radius)
    .attr("fill", color);
  if (backgroundColor) {
    pattern.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", widthHeight)
      .attr("height", widthHeight)
      .attr("fill", backgroundColor)
  }
  return pattern.node();
}

export function diagonalLinePattern(id?: string, backgroundColor?: string) {
  const pattern = d3.create("svg:pattern")
    .attr("id", id || "diagonal-hatch")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 4)
    .attr("height", 4);
  if (backgroundColor) {
    pattern.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 4)
      .attr("height", 4)
      .attr("fill", backgroundColor)
  }
  pattern.append("path")
    .attr("d", "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2")
    .attr("style", "stroke:black; stroke-width:1");
  return pattern.node();
}
