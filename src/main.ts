import { diagonalLinePattern, smallCirclePattern } from './patterns';
import './style.css'
import { simulateUWAttacks, simulationResults } from './underworlds';
import * as d3 from 'd3';

interface resultData {
  winners: Array<pieData>;
  crits: Array<pieData>;
}

interface pieData {
  name: string;
  value: number;
}

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
let initData = {
  winners: [
    { name: "Failure", value: .2 },
    { name: "Tie", value: .3 },
    { name: "Success", value: .5 },
  ],
  crits: []
};
const color = d3.scaleOrdinal()
  .domain(["Failure", "Tie", "Success", "TieDefender", "TieNone", "TieAttacker", "SuccessDefender", "SuccessNone", "SuccessAttacker"])
  .range(["#6d60faff", "#9c9c9cff", "#ca5252ff", "url(#circle-hatch)", "#0000", "url(#diagonal-hatch)", "url(#circle-hatch)", "#0000", "url(#diagonal-hatch)"]);
const svg = d3.select("#chart").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [-width / 2, - height / 2, width, height]);

const defs = svg.append("defs");
defs.append(() => smallCirclePattern());
defs.append(() => diagonalLinePattern());

let drawResultsPie = (data: resultData) => {
  const pie = d3.pie<pieData>()
    .sort(null)
    .value((d) => d.value);
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius - 1);
  const labelRadius = (radius - 1) * 0.6;
  const arcLabel = d3.arc()
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

const resultsToData = (results: simulationResults): resultData => {
  return {
    winners: [
      { name: "Failure", value: results.defenderWins.count / results.numSimulations },
      { name: "Tie", value: results.ties.count / results.numSimulations },
      { name: "Success", value: results.attackerWins.count / results.numSimulations },
    ],
    crits: [
      { name: "Failure", value: results.defenderWins.count / results.numSimulations },
      { name: "TieDefender", value: results.ties.defenderCritWins / results.numSimulations },
      { name: "TieNone", value: (results.ties.count - results.ties.defenderCritWins - results.ties.attackerCritWins) / results.numSimulations },
      { name: "TieAttacker", value: results.ties.attackerCritWins / results.numSimulations },
      { name: "SuccessDefender", value: results.attackerWins.defenderCritWins / results.numSimulations },
      { name: "SuccessNone", value: (results.attackerWins.count - results.attackerWins.defenderCritWins - results.attackerWins.attackerCritWins) / results.numSimulations },
      { name: "SuccessAttacker", value: results.attackerWins.attackerCritWins / results.numSimulations },
    ]
  }
}

drawResultsPie(initData);
