const TestResultsTree: React.FC<{ results: GroupedTestResults }> = ({ results }) => {
  const { onFileOpen } = useContext<TestRunState>(TestRunData);
  const { expansionStates, onUpdateExpansionStates } = useContext<TestExpansionState>(TestsExpansionStatesContext);

  const handleToggle = (key: string, expanded: boolean) => {
    onUpdateExpansionStates(key, expanded);
  };

  const renderMethod = (method: TestResultState, parentKey: string) => {
    const { success, state, moduleName, duration, lineno, name } = method;
    const icon = testStateIcon(state, success);
    const formattedDuration = formatDurationFromSeconds(duration);
    const key = `${parentKey}.${name}`;

    return (
      <vscode-tree-item
        key={key}
        id={key}
        aria-label={name}
        data-key={key}
        onClick={async () => { await onFileOpen(moduleName, lineno); }}
      >
        <div className="treeItemRow">
          {icon}
          <span className="treeItemLabel">{name}</span>
          <GoToFileAtTestUriIcon moduleName={moduleName} lineno={lineno} />
          <span className="duration">{formattedDuration}</span>
        </div>
      </vscode-tree-item>
    );
  };

  const renderClass = (moduleName: string, cls: GroupedClassResult) => {
    const { methods } = cls;
    const { success, duration, state, name, lineno } = cls.state;
    const icon = testStateIcon(state, success);
    const formattedDuration = formatDurationFromSeconds(duration);
    const fullClassKey = `${moduleName}.${name}`;
    const expanded = expansionStates[fullClassKey] ?? true;

    return (
      <vscode-tree-item
        key={fullClassKey}
        id={fullClassKey}
        data-key={fullClassKey}
        expanded={expanded}
        onToggle={(e: any) => handleToggle(fullClassKey, e.detail.expanded)}
      >
        <div className="treeItemRow" onClick={async () => { await onFileOpen(moduleName, lineno); }}>
          {icon}
          <span className="treeItemLabel">{name}</span>
          <GoToFileAtTestUriIcon moduleName={moduleName} lineno={lineno} />
          <span className="duration">{formattedDuration}</span>
        </div>
        {
          Object.entries(methods).map(([methodName, methodResult]) =>
            renderMethod(methodResult, fullClassKey)
          )
        }
      </vscode-tree-item>
    );
  };

  const renderModule = (moduleName: string, mod: GroupedModuleResult) => {
    const { classes } = mod;
    const { success, duration, state } = mod.state;
    const icon = testStateIcon(state, success);
    const formattedDuration = formatDurationFromSeconds(duration);
    const expanded = expansionStates[moduleName] ?? false;

    return (
      <vscode-tree-item
        key={moduleName}
        id={moduleName}
        data-key={moduleName}
        expanded={expanded}
        onToggle={(e: any) => handleToggle(moduleName, e.detail.expanded)}
      >
        <div className="treeItemRow" onClick={async () => { await onFileOpen(moduleName); }}>
          {icon}
          <span className="treeItemLabel">{moduleName}</span>
          <GoToFileAtTestUriIcon moduleName={moduleName} />
          <span className="duration">{formattedDuration}</span>
        </div>
        {
          Object.entries(classes).map(([className, cls]) =>
            renderClass(moduleName, cls)
          )
        }
      </vscode-tree-item>
    );
  };

  return (
    <vscode-tree>
      {Object.entries(results.modules).map(([moduleName, mod]) =>
        renderModule(moduleName, mod)
      )}
    </vscode-tree>
  );
};

