import "./style.css";
import { simulateUWAttacks, simulationResults } from "./underworlds";
import { UWCombatPie, ResultData } from "./uwCombatPie";
import * as d3 from "d3";
import { ResultTableData, UWCombatTable } from "./uwCombatTable";

const rollBtn = document.querySelector<HTMLButtonElement>("#roll-btn")!;
const dscptExpandBtn = document.querySelector<HTMLSpanElement>("#description-expand")!;
const numSimulationsInp = document.querySelector<HTMLInputElement>("#num-simulations")!;
const attackerDiceInp = document.querySelector<HTMLInputElement>("#attacker-dice")!;
const attackerTargetInp = document.querySelector<HTMLInputElement>("#attacker-target")!;
const attackerRerollInp = document.querySelector<HTMLInputElement>("#attacker-rerolls")!;
const defenderDiceInp = document.querySelector<HTMLInputElement>("#defender-dice")!;
const defenderTargetInp = document.querySelector<HTMLInputElement>("#defender-target")!;
const defenderRerollInp = document.querySelector<HTMLInputElement>("#defender-rerolls")!;

const width = 300,
  height = 300,
  svgId = "chartSvg";
d3.select("#chart").append("svg")
  .attr("id", svgId)
  .attr("style", `max-width: ${width}px; max-height: ${height}px`)
  .attr("viewBox", [-width / 2, -height / 2, width, height]);
const pieChart = new UWCombatPie(`#${svgId}`, width);
pieChart.init();

const table = new UWCombatTable("results-table");
table.init();

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
  pieChart.draw(resultsToPieData(results));
  table.draw(resultsToTableData(results));
});

dscptExpandBtn.addEventListener("click", (ev: PointerEvent) => {
  ev.preventDefault();
  const hiddenDescription = document.querySelector<HTMLDivElement>("#hidden-description")!;
  if (hiddenDescription.className !== "expanded") {
    hiddenDescription.className = "expanded";
  } else {
    hiddenDescription.className = "";
  }
});

const resultsToPieData = (results: simulationResults): ResultData => {
  return {
    winners: [
      { name: "failure", value: results.defenderWins.count / results.numSimulations },
      { name: "tie", value: results.ties.count / results.numSimulations },
      { name: "success", value: results.attackerWins.count / results.numSimulations },
    ],
    crits: [
      { name: "failure", value: results.defenderWins.count / results.numSimulations },
      { name: "tie-standfast", value: results.ties.defenderCritWins / results.numSimulations },
      { name: "tie-none", value: (results.ties.count - results.ties.defenderCritWins - results.ties.attackerCritWins) / results.numSimulations },
      { name: "tie-overrun", value: results.ties.attackerCritWins / results.numSimulations },
      { name: "success-standfast", value: results.attackerWins.defenderCritWins / results.numSimulations },
      { name: "success-none", value: (results.attackerWins.count - results.attackerWins.defenderCritWins - results.attackerWins.attackerCritWins) / results.numSimulations },
      { name: "success-overrun", value: results.attackerWins.attackerCritWins / results.numSimulations },
    ],
  };
};

const resultsToTableData = (results: simulationResults): ResultTableData => {
  return [
    { name: "success", value: results.attackerWins.count / results.numSimulations },
    { name: "success-overrun", value: results.attackerWins.attackerCritWins / results.numSimulations },
    { name: "success-standfast", value: results.attackerWins.defenderCritWins / results.numSimulations },
    { name: "tie", value: results.ties.count / results.numSimulations },
    { name: "tie-standfast", value: results.ties.defenderCritWins / results.numSimulations },
    { name: "tie-overrun", value: results.ties.attackerCritWins / results.numSimulations },
    { name: "failure", value: results.defenderWins.count / results.numSimulations },
  ];
};
