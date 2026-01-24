import "./style.css";
import { calculateUWAttack, simulateUWAttacks, simulationResults, uwCombatCalcResult } from "./underworlds";
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
  pieChart.update(simResultsToPieData(results));
  table.draw(simResultsToTableData(results));
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
    document.querySelector("input")?.dispatchEvent(new Event("change"));
  }
});

// automatic triggers calcuation when not using monte carlo
const inputs = document.querySelectorAll<HTMLInputElement|HTMLSelectElement>("#inputs-wrapper input,#inputs-wrapper select");
inputs.forEach((element) => {
  element.addEventListener("change", () => {
    if (!monteCarlo) {
      const results = calculateUWAttack({
        attackerDice: parseInt(attackerDiceInp.value),
        attackerSuccess: parseInt(attackerTargetInp.value),
        attackerRerolls: parseInt(attackerRerollInp.value),
        defenderDice: parseInt(defenderDiceInp.value),
        defenderSuccess: parseInt(defenderTargetInp.value),
        defenderRerolls: parseInt(defenderRerollInp.value),
      });
      pieChart.update(calcResultsToPieData(results));
      table.draw(calcResultsToTableData(results));
    }
  });
});

// utils
const calcResultsToPieData = (results: uwCombatCalcResult): ResultData => {
  return {
    winners: [
      { name: "failure", value: results.failure },
      { name: "tie", value: results.tie },
      { name: "success", value: results.success },
    ],
    crits: [
      { name: "failure-crits", value: results.failure },
      { name: "tie-standfast", value: results.tieStandfast },
      { name: "tie-none", value: results.tie - results.tieOverrun - results.tieStandfast},
      { name: "tie-overrun", value: results.tieOverrun },
      { name: "success-standfast", value: results.successStandfast },
      { name: "success-none", value: results.success - results.successOverrun - results.successStandfast },
      { name: "success-overrun", value: results.successOverrun },
    ],
  }
}

const simResultsToPieData = (results: simulationResults): ResultData => {
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

const calcResultsToTableData = (results: uwCombatCalcResult): ResultTableData => {
  return [
    { name: "success", value: results.success },
    { name: "success-overrun", value: results.successOverrun },
    { name: "success-standfast", value: results.successStandfast },
    { name: "tie", value: results.tie },
    { name: "tie-overrun", value: results.tieOverrun },
    { name: "tie-standfast", value: results.tieStandfast },
    { name: "failure", value: results.failure },
    { name: "push", value: results.success + results.tie - results.tieStandfast - results.successStandfast },
    { name: "push-overrun", value: results.successOverrun + results.tieOverrun },
    { name: "no-push", value: results.failure + results.tieStandfast + results.successStandfast },
  ];
};

const simResultsToTableData = (results: simulationResults): ResultTableData => {
  const pushOverruns = results.attackerWins.attackerCritWins + results.ties.attackerCritWins;
  const noPushs = results.attackerWins.defenderCritWins + results.ties.defenderCritWins + results.defenderWins.count;
  const pushs = results.numSimulations - noPushs;
  return [
    { name: "success", value: results.attackerWins.count / results.numSimulations },
    { name: "success-overrun", value: results.attackerWins.attackerCritWins / results.numSimulations },
    { name: "success-standfast", value: results.attackerWins.defenderCritWins / results.numSimulations },
    { name: "tie", value: results.ties.count / results.numSimulations },
    { name: "tie-overrun", value: results.ties.attackerCritWins / results.numSimulations },
    { name: "tie-standfast", value: results.ties.defenderCritWins / results.numSimulations },
    { name: "failure", value: results.defenderWins.count / results.numSimulations },
    { name: "push", value: pushs / results.numSimulations },
    { name: "push-overrun", value: pushOverruns / results.numSimulations },
    { name: "no-push", value: noPushs / results.numSimulations },
  ];
};

// on intial load, trigger a draw from current/saved inputs.
inputs[0].dispatchEvent(new Event("change"));
