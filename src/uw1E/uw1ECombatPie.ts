import * as d3 from "d3";
import { diagonalLinePattern } from "../patterns";
import { PieData, ResultData } from "../uwCombatPie";
import { BaseType } from "d3";

const colorDefs = {
  "misses": "#6d60faff",
  "draws": "#9c9c9cff",
  "hits": "#ca5252ff",
  "hits-crits": "url(#diagonal-hatch)",
  "non-crits": "#0000",
};
const color = d3.scaleOrdinal<string>()
  .domain(Object.keys(colorDefs))
  .range(Object.values(colorDefs));

const initData = {
  winners: [
    { name: "misses", value: 0.25 },
    { name: "draws", value: 0.25 },
    { name: "hits", value: 0.5 },
  ],
  crits: [
    { name: "non-crits", value: 0.796 },
    { name: "hits-crits", value: 0.204 },
  ],
};

export class UW1ECombatPie {
  svgId: string;
  diameter: number;
  outerThickness: number;
  previous: Record<string, d3.PieArcDatum<PieData>>;
  private pie: d3.Pie<UW1ECombatPie, PieData>;
  private innerArc: d3.Arc<BaseType | UW1ECombatPie, d3.PieArcDatum<PieData>>;
  private labelArc: d3.Arc<BaseType, d3.PieArcDatum<PieData>>;

  constructor(svgId: string, diameter: number) {
    this.svgId = svgId;
    this.diameter = diameter;
    this.outerThickness = 10;
    this.previous = {};
    this.pie = d3.pie<PieData>()
      .sort(null)
      .value(d => d.value);
    this.innerArc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(0)
      .outerRadius(((this.diameter - this.outerThickness - 10) / 2) - 1);
    const labelRadius = ((this.diameter / 2) - 1) * 0.5;
    this.labelArc = d3.arc<d3.PieArcDatum<PieData>>()
      .outerRadius(labelRadius)
      .innerRadius(labelRadius);

    const svg = d3.select(this.svgId);
    const defs = svg.append("defs");
    defs.append(() => diagonalLinePattern("red-diagonal-hatch", "#ca5252ff"));

    const winnersArcs = this.pie(initData.winners);
    const critsArcs = this.pie(initData.crits);

    svg.append("g")
      .attr("id", "winners")
      .selectAll("path")
      .data(winnersArcs)
      .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", this.innerArc)
      .each((d) => { this.previous[d.data.name] = d; });

    svg.append("g")
      .attr("id", "crits")
      .selectAll("path")
      .data(critsArcs)
      .join("path")
      .attr("d", this.innerArc)
      .attr("fill", d => color(d.data.name))
      .each((d) => { this.previous[d.data.name] = d; });

    // labels
    svg.append("g")
      .attr("id", "labels")
      .attr("text-anchor", "middle")
      .selectAll()
      .data(winnersArcs)
      .join("text")
      .attr("transform", d => `translate(${this.labelArc.centroid(d)})`)
      .attr("fill", "#FFF")
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.1).append("tspan")
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
    const transitionDur = 200;

    const arcTween = (a: d3.PieArcDatum<PieData>): (t: number) => string => {
      const interpo = d3.interpolate(this.previous[a.data.name], a);
      this.previous[a.data.name] = a;
      return (t: number) => this.innerArc(interpo(t)) || "";
    };

    const winnersArcs = this.pie(data.winners);
    const critsArcs = this.pie(data.crits);

    const svg = d3.select(this.svgId);
    svg.selectAll("#winners")
      .selectAll("path")
      .data(winnersArcs)
      .transition()
      .duration(transitionDur)
      .attrTween("d", arcTween);
    svg.selectAll("#crits")
      .selectAll("path")
      .data(critsArcs)
      .transition()
      .duration(transitionDur)
      .attrTween("d", arcTween);
    svg.selectAll("#labels")
      .selectAll("text")
      .data(winnersArcs)
      .transition()
      .duration(transitionDur)
      .attr("transform", d => `translate(${this.labelArc.centroid(d)})`)
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

  simplePie(data: ResultData) {
    const winnersArcs = this.pie(data.winners);
    const svg = d3.create("svg");
    svg.append("g")
      .attr("id", "winners")
      .selectAll("path")
      .data(winnersArcs)
      .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", this.innerArc);
    return svg;
  }
}
