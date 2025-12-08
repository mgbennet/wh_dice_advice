export type ResultTableData = { name: string; value: number }[];

const initData = [
  { name: "success", value: 0.5 },
  { name: "success-overrun", value: 0.204 },
  { name: "success-standfast", value: 0.019 },
  { name: "tie", value: 0.25 },
  { name: "tie-overrun", value: 0.056 },
  { name: "tie-standfast", value: 0.056 },
  { name: "failure", value: 0.25 },
];

const tableDef = [
  { title: "Success", id: "success-row", iconColor: "#ca5252ff", iconPattern: undefined },
  { title: "Success + Overrun", id: "success-overrun-row", iconColor: "#ca5252ff", iconPattern: "diagonal-hatch" },
  { title: "Success + Stand Fast", id: "success-standfast-row", iconColor: "#ca5252ff", iconPattern: "circle-hatch" },
  { title: "Tie", id: "tie-row", iconColor: "#9c9c9cff", iconPattern: undefined },
  { title: "Tie + Overrun", id: "tie-overrun-row", iconColor: "#9c9c9cff", iconPattern: "diagonal-hatch" },
  { title: "Tie + Stand Fast", id: "tie-standfast-row", iconColor: "#9c9c9cff", iconPattern: "circle-hatch" },
  { title: "Failure", id: "failure-row", iconColor: "#6d60faff", iconPattern: undefined },
];

export class UWCombatTable {
  divId: string;

  constructor(divId: string) {
    this.divId = divId;
    const div = document.querySelector(`#${divId}`);
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    for (let i = 0; i < 7; i++) {
      const row = document.createElement("tr");
      row.id = tableDef[i].id;
      const iconCell = document.createElement("td");
      const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      iconSvg.style = `background-color: ${tableDef[i].iconColor}; width: 16px; height: 16px`;
      if (tableDef[i].iconPattern) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("fill", `url(#${tableDef[i].iconPattern})`);
        rect.setAttribute("width", "16");
        rect.setAttribute("height", "16");
        iconSvg.appendChild(rect);
      }
      iconCell.appendChild(iconSvg);
      const titleCell = document.createElement("td");
      titleCell.textContent = tableDef[i].title;
      const numberCell = document.createElement("td");
      numberCell.textContent = "-";
      row.appendChild(iconCell);
      row.appendChild(titleCell);
      row.appendChild(numberCell);
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    div?.appendChild(table);
  }

  init() {
    this.draw(initData);
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
