import { dicePool, reroll } from './dice';

const rolls: number[][] = [];
for (let i = 0; i < 100; i++) {
  rolls.push(dicePool(3));
}
const successRoll = 5;
const requiredSuccesses = 2;
const successCount = rolls.filter((rollPool) => rollPool.filter((roll) => roll >= successRoll).length >= requiredSuccesses).length;
console.log(`Number of successful rolls: ${successCount}`);

const examplePool = [6,5,4,3,2,1];
const numRerolls = 8;
console.log(`Rerolling pool: ${examplePool} with success=5+, rerolls = ${numRerolls}`)
console.log(reroll(examplePool, 5, numRerolls));
