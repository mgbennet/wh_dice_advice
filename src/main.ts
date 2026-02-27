import "./style.css";
import { calculateUWAttack, simulateUWAttacks, simulationResults, uwCombatCalcResult } from "./underworlds";
import { UWCombatPie, ResultData } from "./uwCombatPie";
import * as d3 from "d3";
import { ResultTableData, UWCombatTable } from "./uwCombatTable";

const rollBtn = <HTMLButtonElement>document.getElementById("roll-btn")!;
const numSimulationsInp = <HTMLInputElement>document.getElementById("num-simulations")!;
const inputNames = [
  "attacker-dice",
  "attacker-target",
  "attacker-rerolls",
  "attacker-missestohits",
  "attacker-hitstocrits",
  "defender-dice",
  "defender-target",
  "defender-rerolls",
];
const atkDiceInp = <HTMLInputElement>document.getElementById("attacker-dice")!;
const atkTargetInp = <HTMLInputElement>document.getElementById("attacker-target")!;
const atkRerollInp = <HTMLInputElement>document.getElementById("attacker-rerolls")!;
const atkMissestohitsInp = <HTMLInputElement>document.getElementById("attacker-missestohits")!;
const atkHitstocritsInp = <HTMLInputElement>document.getElementById("attacker-hitstocrits")!;
const defDiceInp = <HTMLInputElement>document.getElementById("defender-dice")!;
const defTargetInp = <HTMLInputElement>document.getElementById("defender-target")!;
const defRerollInp = <HTMLInputElement>document.getElementById("defender-rerolls")!;

// const attackerAdvancedToggle = document.querySelector<HTMLButtonElement>("#attacker-advanced-toggle");
let monteCarlo = false;
const monteCarloToggle = <HTMLButtonElement>document.getElementById("monteCarloToggle");

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
    atkDice: parseInt(atkDiceInp.value),
    atkSuccess: parseInt(atkTargetInp.value),
    atkRerolls: parseInt(atkRerollInp.value),
    atkHitsToCrit: parseInt(atkHitstocritsInp.value),
    atkMissesToHits: parseInt(atkMissestohitsInp.value),
    defDice: parseInt(defDiceInp.value),
    defSuccess: parseInt(defTargetInp.value),
    defRerolls: parseInt(defRerollInp.value),
  });
  pieChart.update(simResultsToPieData(results));
  table.draw(simResultsToTableData(results));
});

for (let i = 0; i < inputNames.length; i++) {
  const name = inputNames[i];
  document.getElementById(`${name}-inc`)!.addEventListener("click", () => {
    const input = <HTMLInputElement>document.getElementById(`${name}`)!;
    if (name.includes("target")) {
      if (input.value !== "6")
        input.value = (parseInt(input.value) + 1).toString();
    } else {
      input.value = (parseInt(input.value) + 1).toString();
    }
    input.dispatchEvent(new Event("change"));
  });
  document.getElementById(`${name}-dec`)!.addEventListener("click", () => {
    const input = <HTMLInputElement>document.getElementById(`${name}`)!;
    if (name.includes("target")) {
      if (input.value !== "1")
        input.value = (parseInt(input.value) - 1).toString();
    } else {
      input.value = (parseInt(input.value) > 0 ? parseInt(input.value) - 1 : 0).toString();
    }
    input.dispatchEvent(new Event("change"));
  });
}

document.querySelectorAll<HTMLButtonElement>(".double-line-toggle").forEach((toggleBtn) => {
  toggleBtn.addEventListener("click", () => {
    const secondLine = toggleBtn.parentElement?.querySelector<HTMLElement>(".second-line");
    if (secondLine)
      toggleElementVisibility(secondLine, "flex");
  });
});

// attackerAdvancedToggle?.addEventListener("click", () => {
//   const advancedSettingsSection = document.querySelector<HTMLDivElement>("#attacker-advanced-section")!;
//   if (advancedSettingsSection.style.display === "none") {
//     advancedSettingsSection.style.display = "block";
//   } else {
//     advancedSettingsSection.style.display = "none";
//   }
// });

monteCarloToggle?.addEventListener("click", () => {
  monteCarlo = !monteCarlo;
  if (monteCarlo) {
    monteCarloToggle.title = "Use calculation";
    monteCarloToggle.setAttribute("class", "toCalculation");
    document.getElementById("monteCarloSection")?.setAttribute("style", "display: block");
  } else {
    monteCarloToggle.title = "Use Monte Carlo simulation";
    monteCarloToggle.setAttribute("class", "toMonteCarlo");
    document.getElementById("monteCarloSection")?.setAttribute("style", "display: none");
    document.querySelector("input")?.dispatchEvent(new Event("change"));
  }
});

// automatic triggers calculation when not using monte carlo
const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("#inputs-wrapper input,#inputs-wrapper select");
inputs.forEach((element) => {
  element.addEventListener("change", () => {
    if (!monteCarlo) {
      const results = calculateUWAttack({
        atkDice: parseInt(atkDiceInp.value),
        atkSuccess: parseInt(atkTargetInp.value),
        atkRerolls: parseInt(atkRerollInp.value),
        atkHitsToCrit: parseInt(atkHitstocritsInp.value),
        atkMissesToHits: parseInt(atkMissestohitsInp.value),
        defDice: parseInt(defDiceInp.value),
        defSuccess: parseInt(defTargetInp.value),
        defRerolls: parseInt(defRerollInp.value),
      });
      pieChart.update(calcResultsToPieData(results));
      table.draw(calcResultsToTableData(results));
    }
  });
});

// utils
const toggleElementVisibility = (elem: HTMLElement, display = "block") => {
  if (elem.style.display === "none") {
    elem.style.display = display;
  } else {
    elem.style.display = "none";
  }
};

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
      { name: "tie-none", value: results.tie - results.tieOverrun - results.tieStandfast },
      { name: "tie-overrun", value: results.tieOverrun },
      { name: "success-standfast", value: results.successStandfast },
      { name: "success-none", value: results.success - results.successOverrun - results.successStandfast },
      { name: "success-overrun", value: results.successOverrun },
    ],
  };
};

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
  const noPushes = results.attackerWins.defenderCritWins + results.ties.defenderCritWins + results.defenderWins.count;
  const pushes = results.numSimulations - noPushes;
  return [
    { name: "success", value: results.attackerWins.count / results.numSimulations },
    { name: "success-overrun", value: results.attackerWins.attackerCritWins / results.numSimulations },
    { name: "success-standfast", value: results.attackerWins.defenderCritWins / results.numSimulations },
    { name: "tie", value: results.ties.count / results.numSimulations },
    { name: "tie-overrun", value: results.ties.attackerCritWins / results.numSimulations },
    { name: "tie-standfast", value: results.ties.defenderCritWins / results.numSimulations },
    { name: "failure", value: results.defenderWins.count / results.numSimulations },
    { name: "push", value: pushes / results.numSimulations },
    { name: "push-overrun", value: pushOverruns / results.numSimulations },
    { name: "no-push", value: noPushes / results.numSimulations },
  ];
};

// on initial load, trigger a draw from current/saved inputs.
inputs[0].dispatchEvent(new Event("change"));
