import "./style.css";
import { simulateUWAttacks, simulationResults } from "./underworlds";
import { UWCombatPie, ResultData } from "./uwCombatPie";
import * as d3 from "d3";
import { ResultTableData, UWCombatTable } from "./uwCombatTable";


const rollBtn = document.querySelector<HTMLButtonElement>("#roll-btn")!;
const numSimulationsInp = document.querySelector<HTMLInputElement>("#num-simulations")!;
const inputNames = [
  "attacker-dice",
  "attacker-target",
  "attacker-rerolls",
  "defender-dice",
  "defender-target",
  "defender-rerolls",
];
const attackerDiceInp = document.querySelector<HTMLInputElement>("#attacker-dice")!;
const attackerTargetInp = document.querySelector<HTMLInputElement>("#attacker-target")!;
const attackerRerollInp = document.querySelector<HTMLInputElement>("#attacker-rerolls")!;
const defenderDiceInp = document.querySelector<HTMLInputElement>("#defender-dice")!;
const defenderTargetInp = document.querySelector<HTMLInputElement>("#defender-target")!;
const defenderRerollInp = document.querySelector<HTMLInputElement>("#defender-rerolls")!;

let monteCarlo = false;
const monteCarloToggle = document.querySelector<HTMLButtonElement>("#monteCarloToggle");

const canvasSize = 300,
  svgId = "chartSvg";
d3.select("#chart").append("svg")
  .attr("id", svgId)
  .attr("style", `max-width: ${canvasSize}px; max-height: ${canvasSize}px`)
  .attr("viewBox", [-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize]);
const pieChart = new UWCombatPie(`#${svgId}`, canvasSize);

const table = new UWCombatTable("results-table");

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
  pieChart.update(resultsToPieData(results));
  table.draw(resultsToTableData(results));
});

for (let i = 0; i < inputNames.length; i++) {
  const name = inputNames[i];
  document.querySelector<HTMLDivElement>(`#${name}-inc`)!.addEventListener("click", () => {
    const input = document.querySelector<HTMLInputElement>(`#${name}`)!;
    if (name.includes("target")) {
      if (input.value !== "6")
        input.value = (parseInt(input.value) + 1).toString();
    } else {
      input.value = (parseInt(input.value) + 1).toString();
    }
    input.dispatchEvent(new Event("change"));
  });
  document.querySelector<HTMLDivElement>(`#${name}-dec`)!.addEventListener("click", () => {
    const input = document.querySelector<HTMLInputElement>(`#${name}`)!;
    if (name.includes("target")) {
      if (input.value !== "1")
        input.value = (parseInt(input.value) - 1).toString();
    } else {
      input.value = (parseInt(input.value) > 0 ? parseInt(input.value) - 1 : 0).toString();
    }
    input.dispatchEvent(new Event("change"));
  });
}

monteCarloToggle?.addEventListener("click", () => {
  monteCarlo = !monteCarlo;
  if (monteCarlo) {
    monteCarloToggle.textContent = "Use binomal calculation";
    document.querySelector("#monteCarloSection")?.setAttribute("style", "display: block");
  } else {
    monteCarloToggle.textContent = "Use Monte Carlo simulation";
    document.querySelector("#monteCarloSection")?.setAttribute("style", "display: none");
  }
});

// automatic updates when not using monte carlo
const inputs = document.querySelectorAll<HTMLInputElement|HTMLSelectElement>("#inputs-wrapper input,#inputs-wrapper select");
inputs.forEach((element) => {
  element.addEventListener("change", () => {
    if (!monteCarlo) {
      const results = simulateUWAttacks({
        simulations: 10000,
        attackerDice: parseInt(attackerDiceInp.value),
        attackerSuccess: parseInt(attackerTargetInp.value),
        attackerRerolls: parseInt(attackerRerollInp.value),
        defenderDice: parseInt(defenderDiceInp.value),
        defenderSuccess: parseInt(defenderTargetInp.value),
        defenderRerolls: parseInt(defenderRerollInp.value),
      });
      pieChart.update(resultsToPieData(results));
      table.draw(resultsToTableData(results));
    }
  });
});

// utils
const resultsToPieData = (results: simulationResults): ResultData => {
  return {
    winners: [
      { name: "failure", value: results.defenderWins.count / results.numSimulations },
      { name: "tie", value: results.ties.count / results.numSimulations },
      { name: "success", value: results.attackerWins.count / results.numSimulations },
    ],
    crits: [
      { name: "failure-crits", value: results.defenderWins.count / results.numSimulations },
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
  const pushOverruns = results.attackerWins.attackerCritWins + results.ties.attackerCritWins;
  const noPushs = results.attackerWins.defenderCritWins + results.ties.defenderCritWins + results.defenderWins.count;
  const pushs = results.numSimulations - noPushs;
  return [
    { name: "success", value: results.attackerWins.count / results.numSimulations },
    { name: "success-overrun", value: results.attackerWins.attackerCritWins / results.numSimulations },
    { name: "success-standfast", value: results.attackerWins.defenderCritWins / results.numSimulations },
    { name: "tie", value: results.ties.count / results.numSimulations },
    { name: "tie-standfast", value: results.ties.defenderCritWins / results.numSimulations },
    { name: "tie-overrun", value: results.ties.attackerCritWins / results.numSimulations },
    { name: "failure", value: results.defenderWins.count / results.numSimulations },
    { name: "push", value: pushs / results.numSimulations },
    { name: "push-overrun", value: pushOverruns / results.numSimulations },
    { name: "no-push", value: noPushs / results.numSimulations },
  ];
};
