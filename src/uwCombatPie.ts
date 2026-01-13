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

const colorDefs = {
  "failure": "#6d60faff",
  "tie": "#9c9c9cff",
  "success": "#ca5252ff",
  "failure-crits": "#0000",
  "tie-standfast": "url(#circle-hatch)",
  "tie-none": "#0000",
  "tie-overrun": "url(#diagonal-hatch)",
  "success-standfast": "url(#circle-hatch)",
  "success-none": "#0000",
  "success-overrun": "url(#diagonal-hatch)",
  "push-tie": "#1dad48ff",
  "push-success": "#1dad48ff",
  "push-tie-overrun": "url(#green-diagonal-hatch)",
  "push-success-overrun": "url(#green-diagonal-hatch)",
  "no-push": "#e6f334ff",
  "no-push-success": "#e6f334ff",
}
const color = d3.scaleOrdinal<string>()
  .domain(Object.keys(colorDefs))
  .range(Object.values(colorDefs));

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

const pushDataFromResults = (data: ResultData) => {
  return [
    { name: "no-push", value: data.winners[0].value + data.crits[1].value },
    { name: "push-tie", value: data.winners[1].value - data.crits[1].value - data.crits[3].value },
    { name: "push-tie-overrun", value: data.crits[3].value },
    { name: "no-push-success", value: data.crits[4].value},
    { name: "push-success", value: data.winners[2].value - data.crits[4].value - data.crits[6].value },
    { name: "push-success-overrun", value: data.crits[6].value },
  ]
}

export class UWCombatPie {
  svgId: string;
  diameter: number;
  outerThickness: number;
  previous: Record<string, d3.PieArcDatum<PieData>>;
  private pie: d3.Pie<any, PieData>;
  private innerArc: d3.Arc<any, d3.PieArcDatum<PieData>>;
  private outerArc: d3.Arc<any, d3.PieArcDatum<PieData>>;
  private labelArc: d3.Arc<any, d3.PieArcDatum<PieData>>;

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
    this.outerArc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(((this.diameter - this.outerThickness) / 2) - 1)
      .outerRadius(((this.diameter) / 2) - 1);
    const labelRadius = ((this.diameter / 2) - 1) * 0.5;
    this.labelArc = d3.arc<d3.PieArcDatum<PieData>>()
      .outerRadius(labelRadius)
      .innerRadius(labelRadius);

    const svg = d3.select(this.svgId);
    const defs = svg.append("defs");
    defs.append(() => smallCirclePattern());
    defs.append(() => diagonalLinePattern());
    defs.append(() => diagonalLinePattern("green-diagonal-hatch", "#1dad48ff"));

    const winnersArcs = this.pie(initData.winners);
    const pushArcs = this.pie(pushDataFromResults(initData));
    const critArcs = this.pie(initData.crits);

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
      .data(critArcs)
      .join("path")
      .attr("d", this.innerArc)
      .attr("fill", d => color(d.data.name))
      .each((d) => { this.previous[d.data.name] = d; });

    svg.append("g")
      .attr("id", "pushes")
      .selectAll("path")
      .data(pushArcs)
      .join("path")
      .attr("d", this.outerArc)
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
    const transitionDur = 200;

    const arcTween = (a: d3.PieArcDatum<PieData>): (t: number) => string => {
      const interpo = d3.interpolate(this.previous[a.data.name], a);
      this.previous[a.data.name] = a;
      return (t: number) => 
        (a.data.name.includes('push') 
          ? this.outerArc(interpo(t))
          : this.innerArc(interpo(t))
        ) || "";
    };

    const winnersArcs = this.pie(data.winners);
    const critArcs = this.pie(data.crits);
    const pushArcs = this.pie(pushDataFromResults(data));

    const svg = d3.select(this.svgId);
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
    svg.selectAll("#pushes")
      .selectAll("path")
      .data(pushArcs)
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
}
