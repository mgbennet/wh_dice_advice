import * as d3 from "d3";
import { ResultTableData, UWCombatTable } from "../uwCombatTable";
import { calculateUWAttack, calcResult1E, simResults1E, simulateUWAttacks, uw1ESavedCombat } from "./underworlds1E";
import { ResultData } from "../uwCombatPie";
import { UW1ECombatPie } from "./uw1ECombatPie";

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

const saveCombatBtn = <HTMLButtonElement>document.getElementById("save-combat")!;
const historyList = <HTMLDivElement>document.getElementById("history-list")!;

// const attackerAdvancedToggle = document.querySelector<HTMLButtonElement>("#attacker-advanced-toggle");
let monteCarlo = false;
const monteCarloToggle = <HTMLButtonElement>document.getElementById("monteCarloToggle");

const canvasSize = 300,
  svgId = "chartSvg";
d3.select("#chart").append("svg")
  .attr("id", svgId)
  .attr("style", `max-width: ${canvasSize}px; max-height: ${canvasSize}px`)
  .attr("viewBox", [-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize]);
const pieChart = new UW1ECombatPie(`#${svgId}`, canvasSize);

const table = new UWCombatTable("results-table", true);

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
    attackInnate: 0,
    defenderInnate: 0,
    trapped: false,
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

document.querySelectorAll<HTMLInputElement>(".dice-tog input").forEach((diceToggle) => {
  diceToggle.addEventListener(
    "change",
    () => diceButtonsToSelect(diceToggle.parentElement?.parentElement?.id.startsWith("attacker")),
  );
});

atkTargetInp.addEventListener("change", () => diceSelectToButtons(true));
defTargetInp.addEventListener("change", () => diceSelectToButtons(false));

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
        attackInnate: 0,
        defenderInnate: 0,
        trapped: false,
      });
      pieChart.update(calcResultsToPieData(results));
      table.draw(calcResultsToTableData(results));
    }
  });
});

// dice button state functions
const diceButtonsToSelect = (isAtker: boolean = true) => {
  const buttons = document.querySelectorAll<HTMLInputElement>(`#${isAtker ? "attacker" : "defender"}-dice-togs input`);
  let total = 0;
  for (const btn of buttons) {
    if (btn.checked) {
      if (btn.className.indexOf("hammer") >= 0 || btn.className.indexOf("shield") >= 0) {
        total++;
      }
      total++;
    }
  }
  const targetSelect = isAtker ? atkTargetInp : defTargetInp;
  targetSelect.value = String(7 - total);
};

const diceBtnGuide = [
  [0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 0, 1, 0, 0],
  [1, 0, 1, 1, 0],
  [1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1],
];
const diceSelectToButtons = (setAtker: boolean) => {
  const select = setAtker ? atkTargetInp : defTargetInp;
  const target = 7 - parseInt(select.value);
  const buttons = document.querySelectorAll<HTMLInputElement>(`#${setAtker ? "attacker" : "defender"}-dice-togs input`);
  for (let i = 0; i < 5; i++) {
    buttons[i].checked = diceBtnGuide[target][i] === 1;
  }
};

const calcResultsToPieData = (results: calcResult1E): ResultData => {
  return {
    winners: [
      { name: "misses", value: results.misses },
      { name: "draws", value: results.draws },
      { name: "hits", value: results.hits },
    ],
    crits: [
      { name: "non-crits", value: 1.0 - results.critHits },
      { name: "hits-crits", value: results.critHits },
    ],
  };
};

const simResultsToPieData = (results: simResults1E): ResultData => {
  return {
    winners: [
      { name: "misses", value: results.misses / results.numSimulations },
      { name: "draws", value: results.draws / results.numSimulations },
      { name: "hits", value: results.hits / results.numSimulations },
    ],
    crits: [
      { name: "non-crits", value: (results.numSimulations - results.critHits) / results.numSimulations },
      { name: "hits-crits", value: results.critHits / results.numSimulations },
    ],
  };
};

const calcResultsToTableData = (results: calcResult1E): ResultTableData => {
  return [
    { name: "hits", value: results.hits },
    { name: "hits-crits", value: results.critHits },
    { name: "draws", value: results.draws },
    { name: "misses", value: results.misses },
  ];
};

const simResultsToTableData = (results: simResults1E): ResultTableData => {
  return [
    { name: "hits", value: results.hits / results.numSimulations },
    { name: "hits-crits", value: results.critHits / results.numSimulations },
    { name: "draws", value: results.draws / results.numSimulations },
    { name: "misss", value: results.misses / results.numSimulations },
  ];
};

// on initial load, trigger a draw from current/saved inputs.
inputs[0].dispatchEvent(new Event("change"));
diceSelectToButtons(true);
diceSelectToButtons(false);

const savedCombats: uw1ESavedCombat[] = [];

function loadCombat(combat: uw1ESavedCombat) {
  atkDiceInp.value = String(combat.atkDice);
  atkTargetInp.value = String(combat.atkSuccess);
  atkRerollInp.value = String(combat.atkRerolls);
  atkHitstocritsInp.value = String(combat.atkHitsToCrit);
  atkMissestohitsInp.value = String(combat.atkMissesToHits);
  defDiceInp.value = String(combat.defDice);
  defTargetInp.value = String(combat.defSuccess);
  defRerollInp.value = String(combat.defRerolls);
  diceSelectToButtons(true);
  diceSelectToButtons(false);
  // trigger recalc
  inputs[0].dispatchEvent(new Event("change"));
}

function renderHistoryList() {
  historyList.innerHTML = "";
  savedCombats.forEach((combat) => {
    const tile = document.createElement("div");
    tile.className = "history-tile";
    const tileBtn = document.createElement("button");
    tileBtn.className = "load-history-btn";
    tileBtn.innerHTML = `
      <div class="history-pie">
        ${combat.pieChart && `<svg viewbox=${[-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize]}>${combat.pieChart?.html()}</svg>`}
      </div>
      <div class="history-text">
        <div class="history-tile-atk">
          <span>D: ${combat.atkDice}</span>
          <span>${combat.atkSuccess}+</span>
          <span>RR: ${combat.atkRerolls}</span>
        </div>
        <div class="history-tile-def">
          <span>D: ${combat.defDice}</span>
          <span>${combat.defSuccess}+</span>
          <span>RR: ${combat.defRerolls}</span>
        </div>
      </div>
    `;
    tileBtn.addEventListener("click", () => loadCombat(combat));
    tile.appendChild(tileBtn);
    const delBtn = document.createElement("button");
    delBtn.className = "delete-saved-combat";
    delBtn.ariaLabel = "Delete";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => {
      savedCombats.splice(savedCombats.findIndex(val => val.label === combat.label), 1);
      renderHistoryList();
    });
    tile.appendChild(delBtn);
    historyList.appendChild(tile);
  });
}

saveCombatBtn.addEventListener("click", () => {
  const inputs: uw1ESavedCombat = {
    label: `Atk ${atkDiceInp.value}d ${atkTargetInp.value}+ ${atkRerollInp.value}rr / Def ${defDiceInp.value}d ${defTargetInp.value}+ ${defRerollInp.value}rr`,
    atkDice: parseInt(atkDiceInp.value),
    atkSuccess: parseInt(atkTargetInp.value),
    atkRerolls: parseInt(atkRerollInp.value),
    atkHitsToCrit: parseInt(atkHitstocritsInp.value),
    atkMissesToHits: parseInt(atkMissestohitsInp.value),
    defDice: parseInt(defDiceInp.value),
    defSuccess: parseInt(defTargetInp.value),
    defRerolls: parseInt(defRerollInp.value),
    attackInnate: 0,
    defenderInnate: 0,
    trapped: false,
  };
  const results = calculateUWAttack(inputs);

  const simplePie = pieChart.simplePie(calcResultsToPieData(results));
  inputs.pieChart = simplePie;
  savedCombats.push(inputs);
  renderHistoryList();
});
