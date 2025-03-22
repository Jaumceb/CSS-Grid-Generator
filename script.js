let elementCount = 0; // Contador
  
  // Célula da Grid
function updateGrid() {
  const columns = parseInt(document.getElementById('columns').value);
  const rows = parseInt(document.getElementById('rows').value);
  const gap = parseInt(document.getElementById('gap').value);

  const gridContainer = document.getElementById('gridContainer');
  const cssOutput = document.getElementById('cssOutput');
  const htmlOutput = document.getElementById('htmlOutput');

  gridContainer.innerHTML = '';

  for (let i = 0; i < columns * rows; i++) {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');
    gridItem.setAttribute('id', `cell-${i}`);

    const col = (i % columns) + 1;
    const row = Math.floor(i / columns) + 1;

    gridItem.dataset.col = col;
    gridItem.dataset.row = row;

    const button = document.createElement('button');
    button.textContent = '+';
    gridItem.appendChild(button);
    button.addEventListener('click', function () {
      addElement(gridItem);
      });

    gridItem.addEventListener('dragover', function (event) {
      event.preventDefault();
      });
    
    gridItem.addEventListener('drop', function (event) {
      event.preventDefault();
      const draggedElementId = event.dataTransfer.getData("element-id");
      const draggedElement = document.getElementById(draggedElementId);

      
    if (gridItem.children.length === 1) {
      gridItem.appendChild(draggedElement);
      updateElementCSS(draggedElement, gridItem);
        }
      });

        gridContainer.appendChild(gridItem);
      }

      gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
      gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      gridContainer.style.gridGap = `${gap}px`;

      const css = `
        .grid-container {
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
          grid-template-rows: repeat(${rows}, 1fr);
          grid-gap: ${gap}px;
        }
      `;
      cssOutput.value = css.trim();

      updateHTML();
  }

  //Elemento (DIV)
function addElement(gridItem) {
      elementCount++;
      const element = document.createElement('div');
      element.classList.add('draggable-element');
      element.textContent = `${elementCount}`;
      element.setAttribute('draggable', true);
      element.setAttribute('id', `div${elementCount}`);
      element.dataset.col = gridItem.dataset.col;
      element.dataset.row = gridItem.dataset.row;



      element.addEventListener('dragstart', function (event) {
        event.dataTransfer.setData("element-id", element.id);
        setTimeout(() => element.style.opacity = '0.5', 0);
      });

      element.addEventListener('dragend', function () {
        element.style.opacity = '1';
      });

      const resizeHandle = document.createElement('div');
      resizeHandle.classList.add('resize-handle');
      resizeHandle.innerHTML = `<i class="fa-solid fa-up-right-and-down-left-from-center"></i>`
      element.appendChild(resizeHandle);

      resizeHandle.addEventListener('mousedown', function (event) {
        event.preventDefault();

        const startX = event.clientX;
        const startY = event.clientY;

        const gridContainer = document.getElementById('gridContainer');
        const columns = parseInt(document.getElementById('columns').value);
        const rows = parseInt(document.getElementById('rows').value);
        const gap = parseInt(document.getElementById('gap').value);

        const gridCellWidth = (gridContainer.offsetWidth - (columns - 1) * gap) / columns;
        const gridCellHeight = (gridContainer.offsetHeight - (rows - 1) * gap) / rows;

        const startWidth = element.offsetWidth;
        const startHeight = element.offsetHeight;

        const onMouseMove = function (moveEvent) {
          let deltaX = moveEvent.clientX - startX;
          let deltaY = moveEvent.clientY - startY;

          let newWidth = Math.round((startWidth + deltaX + gap) / (gridCellWidth + gap)) * (gridCellWidth + gap) - gap;
          let newHeight = Math.round((startHeight + deltaY + gap) / (gridCellHeight + gap)) * (gridCellHeight + gap) - gap;

          newWidth = Math.max(newWidth, gridCellWidth);
          newHeight = Math.max(newHeight, gridCellHeight);

          element.style.width = `${newWidth}px`;
          element.style.height = `${newHeight}px`;

          updateElementCSS(element, gridItem);
        };

        const onMouseUp = function () {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      gridItem.appendChild(element);
      updateElementCSS(element, gridItem);

      updateHTML();  
  }
  
  //Código CSS
function updateElementCSS(element, gridItem) {
      const cssOutput = document.getElementById('cssOutput');
      const gridContainer = document.getElementById('gridContainer');
      const gridCellWidth = gridContainer.offsetWidth / parseInt(document.getElementById('columns').value);
      const gridCellHeight = gridContainer.offsetHeight / parseInt(document.getElementById('rows').value);

      const columnStart = parseInt(gridItem.dataset.col);
      const rowStart = parseInt(gridItem.dataset.row);

      const columnSpan = Math.round(element.offsetWidth / gridCellWidth);
      const rowSpan = Math.round(element.offsetHeight / gridCellHeight);

      let cssLines = cssOutput.value.split("\n");
      let newCssLines = [];
      let insideBlock = false;

      for (let line of cssLines) {
        if (line.includes(`#${element.id} {`)) {
          insideBlock = true; 
        }
        if (!insideBlock) {
          newCssLines.push(line); 
        }
        if (insideBlock && line.includes("}")) {
          insideBlock = false; 
        }
      }

      cssOutput.value = newCssLines.join("\n").trim();

      let elementCSS = `#${element.id} {\n`;

      if (columnSpan > 1 || rowSpan > 1) {
        elementCSS += `  grid-column: span ${columnSpan} / span ${columnSpan};\n`;
        elementCSS += `  grid-row: span ${rowSpan} / span ${rowSpan};\n`;
      }

      elementCSS += `  grid-column-start: ${columnStart};\n`;
      elementCSS += `  grid-row-start: ${rowStart};\n`;
      elementCSS += `}`;

      cssOutput.value += `\n${elementCSS.trim()}`;
  }
  //Código HTML
function updateHTML() {
      const gridContainer = document.getElementById('gridContainer');
      const htmlOutput = document.getElementById('htmlOutput');

      let htmlCode = `<div class="grid-container">\n`;

      gridContainer.childNodes.forEach(cell => {

        const elements = cell.querySelectorAll('.draggable-element');
        elements.forEach(element => {
          const elementId = element.id;

          htmlCode += `  <div id="${elementId}">${element.textContent}</div>\n`;
        });
      });

      htmlCode += `</div>`;
      htmlOutput.value = htmlCode.trim();  
  }

  //Inputs
document.getElementById('columns').addEventListener('input', updateGrid);
document.getElementById('rows').addEventListener('input', updateGrid);
document.getElementById('gap').addEventListener('input', updateGrid);

window.onload = updateGrid;