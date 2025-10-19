import { dicePool, reroll } from './dice';
import { simulateUWAttacks } from './underworlds';

const rolls: number[][] = [];
for (let i = 0; i < 100; i++) {
  rolls.push(dicePool(3));
}
const successRoll = 5;
const requiredSuccesses = 2;
const successCount = rolls.filter((rollPool) => rollPool.filter((roll) => roll >= successRoll).length >= requiredSuccesses).length;
console.log(`Number of successful rolls: ${successCount}`);

const examplePool = [6, 5, 4, 3, 2, 1];
const numRerolls = 8;
console.log(`Rerolling pool: ${examplePool} with success=5+, rerolls = ${numRerolls}`)
console.log(reroll(examplePool, 5, numRerolls));

const rollBtn = document.querySelector<HTMLButtonElement>("#roll-btn")!;
const numSimulationsInp = document.querySelector<HTMLInputElement>("#num-simulations")!;
const attackerDiceInp = document.querySelector<HTMLInputElement>("#attacker-dice")!;
const attackerTargetInp = document.querySelector<HTMLInputElement>("#attacker-target")!;
const attackerRerollInp = document.querySelector<HTMLInputElement>("#attacker-rerolls")!;
const defenderDiceInp = document.querySelector<HTMLInputElement>("#defender-dice")!;
const defenderTargetInp = document.querySelector<HTMLInputElement>("#defender-target")!;
const defenderRerollInp = document.querySelector<HTMLInputElement>("#defender-rerolls")!;

rollBtn.addEventListener('click', () => {
  console.log(simulateUWAttacks({
    simulations: parseInt(numSimulationsInp.value),
    attackerDice: parseInt(attackerDiceInp.value),
    attackerSuccess: parseInt(attackerTargetInp.value),
    attackerRerolls: parseInt(attackerRerollInp.value),
    defenderDice: parseInt(defenderDiceInp.value),
    defenderSuccess: parseInt(defenderTargetInp.value),
    defenderRerolls: parseInt(defenderRerollInp.value),
  }));
});
