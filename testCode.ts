const TestModuleComponent = ({ moduleName, classes }) => {
    return (
      <div>
        <h2>{moduleName}</h2>
        {Object.entries(classes).map(([className, methods]) => (
          <TestClassComponent key={className} className={className} methods={methods} />
        ))}
      </div>
    );
  };
  
  const TestClassComponent = ({ className, methods }) => {
    return (
      <div>
        <h3>{className}</h3>
        {Object.entries(methods).map(([methodName, result]) => (
          <TestMethodComponent key={methodName} methodName={methodName} result={result} />
        ))}
      </div>
    );
  };
  
  const TestMethodComponent = ({ methodName, result }) => {
    return (
      <div className={result.success ? 'success' : 'failure'}>
        <span>{methodName}</span>
        <span>{result.formattedDuration}</span>
      </div>
    );
  };
  
  function groupTestResults(testResults) {
    const groupedResults = {};
  
    testResults.forEach(result => {
      const { testModule, className, methodName } = result;
  
      if (!groupedResults[testModule]) {
        groupedResults[testModule] = {};
      }
  
      if (!groupedResults[testModule][className]) {
        groupedResults[testModule][className] = {};
      }
  
      // Assuming methodName is unique per class, or you could append results if not
      groupedResults[testModule][className][methodName] = result;
    });
  
    return groupedResults;
  }

function groupTestResults(testResultsMap: Map<string, Map<string, TestEventResult[]>>): GroupedTestResults {
    const grouped: GroupedTestResults = {};
  
    for (const [testModule, classes] of testResultsMap.entries()) {
      grouped[testModule] = { classes: {}, success: true };
      for (const [className, methods] of classes.entries()) {
        grouped[testModule].classes[className] = { methods: {}, success: true };
        for (const method of methods) {
          grouped[testModule].classes[className].methods[method.methodName] = method;
          if (!method.success) {
            grouped[testModule].success = false;
            grouped[testModule].classes[className].success = false;
          }
        }
      }
    }
  
    return grouped;
  }
