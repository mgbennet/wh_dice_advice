import * as d3 from "d3";
import { diagonalLinePattern, smallCirclePattern } from "./patterns";

export interface ResultData {
  winners: Array<PieData>;
  crits: Array<PieData>;
}

export interface PieData {
  name: string;
  value: number;
}

const color = d3.scaleOrdinal<string>()
  .domain(["Failure", "Tie", "Success", "TieDefender", "TieNone", "TieAttacker", "SuccessDefender", "SuccessNone", "SuccessAttacker"])
  .range(["#6d60faff", "#9c9c9cff", "#ca5252ff", "url(#circle-hatch)", "#0000", "url(#diagonal-hatch)", "url(#circle-hatch)", "#0000", "url(#diagonal-hatch)"]);

const initData = {
  winners: [
    { name: "Failure", value: 0.2 },
    { name: "Tie", value: 0.3 },
    { name: "Success", value: 0.5 },
  ],
  crits: [],
};

export class UWCombatPie {
  svgId: string;
  diameter: number;

  constructor(svgId: string, diameter: number) {
    this.svgId = svgId;
    this.diameter = diameter;
  }

  init() {
    const svg = d3.select(this.svgId);
    const defs = svg.append("defs");
    defs.append(() => smallCirclePattern());
    defs.append(() => diagonalLinePattern());
    this.draw(initData);
  }

  draw(data: ResultData) {
    const svg = d3.select(this.svgId);
    const radius = this.diameter / 2;
    const pie = d3.pie<PieData>()
      .sort(null)
      .value(d => d.value);
    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(0)
      .outerRadius(radius - 1);
    const labelRadius = (radius - 1) * 0.6;
    const arcLabel = d3.arc<d3.PieArcDatum<PieData>>()
      .outerRadius(labelRadius)
      .innerRadius(labelRadius);

    const winnersArcs = pie(data.winners);
    const critArcs = pie(data.crits);

    svg.selectChildren("g").remove();

    svg.append("g").selectAll()
      .data(winnersArcs)
      .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc);

    svg.append("g").selectAll()
      .data(critArcs)
      .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc);

    // labels
    svg.append("g").attr("text-anchor", "middle")
      .selectAll()
      .data(winnersArcs)
      .join("text")
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .attr("fill", "#FFF")
      .call(text => text.append("tspan")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text(d => d.data.name))
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text(d => ((d.data.value * 100).toPrecision(3)) + "%"));
  }
}
