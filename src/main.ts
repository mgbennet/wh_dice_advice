import './style.css'
import { simulateUWAttacks } from './underworlds';
import * as d3 from 'd3';

const rollBtn = document.querySelector<HTMLButtonElement>("#roll-btn")!;
const numSimulationsInp = document.querySelector<HTMLInputElement>("#num-simulations")!;
const attackerDiceInp = document.querySelector<HTMLInputElement>("#attacker-dice")!;
const attackerTargetInp = document.querySelector<HTMLInputElement>("#attacker-target")!;
const attackerRerollInp = document.querySelector<HTMLInputElement>("#attacker-rerolls")!;
const defenderDiceInp = document.querySelector<HTMLInputElement>("#defender-dice")!;
const defenderTargetInp = document.querySelector<HTMLInputElement>("#defender-target")!;
const defenderRerollInp = document.querySelector<HTMLInputElement>("#defender-rerolls")!;

const width = 300,
  height = 300,
  radius = Math.min(width, height) / 2;
let initData = [
  { name: "Failure", value: .2 },
  { name: "Tie", value: .3 },
  { name: "Success", value: .5 },
];
const color = d3.scaleOrdinal()
  .domain(initData.map(d => d.name))
  .range(["#6d60faff", "#ffffbf", "#ca5252ff"]);
const svg = d3.select("#chart").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [-width / 2, - height / 2, width, height]);

let drawResultsPie = (data: { name: string, value: number }[]) => {
  const pie = d3.pie()
    .sort(null)
    .value((d) => d.value);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius - 1);
  const labelRadius = (radius - 1) * 0.6;
  const arcLabel = d3.arc()
    .outerRadius(labelRadius)
    .innerRadius(labelRadius);

  const arcs = pie(data).sort((a, b) => 0);

  svg.selectChildren().remove();
  svg.append("g").selectAll()
    .data(arcs)
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc);

  svg.append("g").attr("text-anchor", "middle")
    .selectAll()
    .data(arcs)
    .join("text")
      .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
      .call(text => text.append("tspan")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text(d => d.data.name))
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
          .attr("x", 0)
          .attr("y", "0.7em")
          .attr("fill-opacity", 0.7)
          .text(d => (d.data.value.toPrecision(3) * 100).toLocaleString("en-US") + "%"));
}

// Button actions
rollBtn.addEventListener("click", () => {
  const results = simulateUWAttacks({
    simulations: parseInt(numSimulationsInp.value),
    attackerDice: parseInt(attackerDiceInp.value),
    attackerSuccess: parseInt(attackerTargetInp.value),
    attackerRerolls: parseInt(attackerRerollInp.value),
    defenderDice: parseInt(defenderDiceInp.value),
    defenderSuccess: parseInt(defenderTargetInp.value),
    defenderRerolls: parseInt(defenderRerollInp.value),
  });
  drawResultsPie(resultsToData(results));
});

const resultsToData = (results) => {
  return [
    { name: "Failure", value: results.defenderWins / results.numSimulations },
    { name: "Tie", value: results.ties / results.numSimulations },
    { name: "Success", value: results.attackerWins / results.numSimulations },
  ]
}

drawResultsPie(initData);
