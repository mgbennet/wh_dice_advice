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
  .domain(["failure", "tie", "success", "failure-crits", "tie-standfast", "tie-none", "tie-overrun", "success-standfast", "success-none", "success-overrun"])
  .range(["#6d60faff", "#9c9c9cff", "#ca5252ff", "#0000", "url(#circle-hatch)", "#0000", "url(#diagonal-hatch)", "url(#circle-hatch)", "#0000", "url(#diagonal-hatch)"]);

const initData = {
  winners: [
    { name: "failure", value: 0.25 },
    { name: "tie", value: 0.25 },
    { name: "success", value: 0.5 },
  ],
  crits: [
    { name: "failure-crits", value: 0.25 },
    { name: "tie-standfast", value: 0.056 },
    { name: "tie-none", value: 0.138 },
    { name: "tie-overrun", value: 0.056 },
    { name: "success-standfast", value: 0.019 },
    { name: "success-none", value: 0.277 },
    { name: "success-overrun", value: 0.204 },
  ],
};

export class UWCombatPie {
  svgId: string;
  diameter: number;
  previous: Record<string, d3.PieArcDatum<PieData>>;

  constructor(svgId: string, diameter: number) {
    this.svgId = svgId;
    this.diameter = diameter;
    this.previous = {};
    const pie = d3.pie<PieData>()
      .sort(null)
      .value(d => d.value);
    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(0)
      .outerRadius((diameter / 2) - 1);

    const svg = d3.select(this.svgId);
    const defs = svg.append("defs");
    defs.append(() => smallCirclePattern());
    defs.append(() => diagonalLinePattern());

    const labelRadius = ((this.diameter / 2) - 1) * 0.6;
    const winnersArcs = pie(initData.winners);
    const critArcs = pie(initData.crits);
    const arcLabel = d3.arc<d3.PieArcDatum<PieData>>()
      .outerRadius(labelRadius)
      .innerRadius(labelRadius);

    svg.append("g")
      .attr("id", "winners")
      .selectAll("path")
      .data(winnersArcs)
      .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
      .each((d) => { this.previous[d.data.name] = d; });

    svg.append("g")
      .attr("id", "crits")
      .selectAll("path")
      .data(critArcs)
      .join("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.name))
      .each((d) => { this.previous[d.data.name] = d; });

    // labels
    svg.append("g")
      .attr("id", "labels")
      .attr("text-anchor", "middle")
      .selectAll()
      .data(winnersArcs)
      .join("text")
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .attr("fill", "#FFF")
      .call(text => text.append("tspan")
        .attr("class", "labelName")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text(d => d.data.name))
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
        .attr("class", "percentLabel")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text(d => ((d.data.value * 100).toPrecision(3)) + "%"));
  }

  update(data: ResultData) {
    const svg = d3.select(this.svgId);
    const pie = d3.pie<PieData>()
      .sort(null)
      .value(d => d.value);
    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(0)
      .outerRadius((this.diameter / 2) - 1);

    const transitionDur = 200;

    const arcTween = (a: d3.PieArcDatum<PieData>): (t: number) => string => {
      const interpo = d3.interpolate(this.previous[a.data.name], a);
      this.previous[a.data.name] = a;
      return (t: number) => arc(interpo(t)) || "";
    };

    const labelRadius = ((this.diameter / 2) - 1) * 0.6;
    const winnersArcs = pie(data.winners);
    const critArcs = pie(data.crits);
    const arcLabel = d3.arc<d3.PieArcDatum<PieData>>()
      .outerRadius(labelRadius)
      .innerRadius(labelRadius);

    svg.selectAll("#winners")
      .selectAll("path")
      .data(winnersArcs)
      .transition()
      .duration(transitionDur)
      .attrTween("d", arcTween);
    svg.selectAll("#crits")
      .selectAll("path")
      .data(critArcs)
      .transition()
      .duration(transitionDur)
      .attrTween("d", arcTween);
    svg.selectAll("#labels")
      .selectAll("text")
      .data(winnersArcs)
      .transition()
      .duration(transitionDur)
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .selectChild(".percentLabel")
      .text((d) => {
        const dCast = d as d3.PieArcDatum<PieData>;
        if ((dCast.endAngle - dCast.startAngle) > 0.25) {
          return (dCast.data.value * 100).toPrecision(3) + "%";
        } else {
          return "";
        }
      });
  }
}
