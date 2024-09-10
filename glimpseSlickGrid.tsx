const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
  const gridOptions = grid.getOptions();
  const treeLevelPropName = gridOptions.treeDataOptions?.levelPropName || '__treeLevel';
  if (value === null || value === undefined || dataContext === undefined) {
    return '';
  }
  const dataView = grid.getData();
  const data = dataView.getItems();
  const identifierPropName = dataView.getIdPropertyName() || 'id';
  const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
  const treeLevel = dataContext[treeLevelPropName];
  const spacer = `<span style="display:inline-block; width:${(15 * treeLevel)}px;"></span>`;

  const customFormatter = approversTreeFormatter(true, new Set(), undefined, undefined);
  const customContent = customFormatter(_row, _cell, value, _columnDef, dataContext);

  if (data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren']) {
    if (dataContext.__collapsed) {
      return `<span class="hidden"></span>${spacer} <span class="slick-group-toggle collapsed" level="${treeLevel}"></span>${customContent.outerHTML}`;
    } else {
      return `<span class="hidden"></span>${spacer} <span class="slick-group-toggle expanded" level="${treeLevel}"></span>${customContent.outerHTML}`;
    }
  } else {
    return `<span class="hidden"></span>${spacer} <span class="slick-group-toggle" level="${treeLevel}"></span>${customContent.outerHTML}`;
  }
};
