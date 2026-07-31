export type ResultTableData = { name: string; value: number }[];

const initData = [
  { name: "success", value: 0.5 },
  { name: "success-overrun", value: 0.204 },
  { name: "success-standfast", value: 0.019 },
  { name: "tie", value: 0.25 },
  { name: "tie-overrun", value: 0.056 },
  { name: "tie-standfast", value: 0.056 },
  { name: "failure", value: 0.25 },
  { name: "push", value: 0.665 },
  { name: "push-overrun", value: 0.26 },
  { name: "no-push", value: 0.325 },
];

const tableDef = [
  { title: "Success", id: "success-row", iconColor: "#ca5252ff", iconPattern: undefined },
  { title: "Success + Overrun", id: "success-overrun-row", iconColor: "#ca5252ff", iconPattern: "diagonal-hatch" },
  { title: "Success + Stand Fast", id: "success-standfast-row", iconColor: "#ca5252ff", iconPattern: "circle-hatch" },
  { title: "Tie", id: "tie-row", iconColor: "#9c9c9cff", iconPattern: undefined },
  { title: "Tie + Overrun", id: "tie-overrun-row", iconColor: "#9c9c9cff", iconPattern: "diagonal-hatch" },
  { title: "Tie + Stand Fast", id: "tie-standfast-row", iconColor: "#9c9c9cff", iconPattern: "circle-hatch" },
  { title: "Failure", id: "failure-row", iconColor: "#6d60faff", iconPattern: undefined },
  { title: "Push", id: "push-row", iconColor: "#1dad48ff", iconPattern: undefined },
  { title: "Push + Overrun", id: "push-overrun-row", iconColor: "#1dad48ff", iconPattern: "diagonal-hatch" },
  { title: "No push", id: "no-push-row", iconColor: "#e6f334ff", iconPattern: undefined },
];

const initData1E = [
  { name: "hits", value: 0.5 },
  { name: "hits-crits", value: 0.204 },
  { name: "draws", value: 0.25 },
  { name: "misses", value: 0.25 },
];

const tableDef1E = [
  { title: "Hit", id: "hits-row", iconColor: "#ca5252ff", iconPattern: undefined },
  { title: "Critical hit", id: "hits-crits-row", iconColor: "#ca5252ff", iconPattern: "diagonal-hatch" },
  { title: "Draw", id: "draws-row", iconColor: "#9c9c9cff", iconPattern: undefined },
  { title: "Miss", id: "misses-row", iconColor: "#6d60faff", iconPattern: undefined },
];

export class UWCombatTable {
  divId: string;

  constructor(divId: string, firstE?: boolean) {
    this.divId = divId;
    const div = document.querySelector(`#${divId}`);
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    const numRows = firstE ? tableDef1E.length : tableDef.length;
    for (let i = 0; i < numRows; i++) {
      const row = document.createElement("tr");
      const def = firstE ? tableDef1E[i] : tableDef[i];
      row.id = def.id;
      const iconCell = document.createElement("td");
      const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      iconSvg.style = `background-color: ${def.iconColor}; width: 16px; height: 16px`;
      if (def.iconPattern) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("fill", `url(#${def.iconPattern})`);
        rect.setAttribute("width", "16");
        rect.setAttribute("height", "16");
        iconSvg.appendChild(rect);
      }
      iconCell.appendChild(iconSvg);
      const titleCell = document.createElement("td");
      titleCell.textContent = def.title;
      const numberCell = document.createElement("td");
      numberCell.textContent = "-";
      row.appendChild(iconCell);
      row.appendChild(titleCell);
      row.appendChild(numberCell);
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    div?.appendChild(table);
    this.draw(firstE ? initData1E : initData);
  }

  draw(data: ResultTableData) {
    for (let i = 0; i < data.length; i++) {
      const row = document.getElementById(data[i].name + "-row");
      if (row && row.lastChild) {
        row.lastChild.textContent = (data[i].value * 100).toPrecision(3) + "%";
      }
    }
  };
};
