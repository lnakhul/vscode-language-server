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

    {
        // Transform your testResults Map here
        const testResultsMap = this.testResults.get(currentReviewId) ?? new Map();
        const testResultsArray = Array.from(testResultsMap).map(([moduleName, testModuleMap]) => {
            const results = Array.from(testModuleMap).map(([className, testDetails]) => ({
                className,
                testDetails
            }));
            return { moduleName, results };
        });


function groupTestResultsFromMap(testResultsMap: Map<string, Map<string, TestEventResult[]>>): GroupedTestResults {
  const grouped: GroupedTestResults = {};

  testResultsMap.forEach((classMap, moduleName) => {
    if (!grouped[moduleName]) {
      grouped[moduleName] = { classes: {}, success: true };
    }

    classMap.forEach((results, className) => {
      if (!grouped[moduleName].classes[className]) {
        grouped[moduleName].classes[className] = { methods: {}, success: true };
      }

      results.forEach(result => {
        const { methodName } = result;
        grouped[moduleName].classes[className].methods[methodName] = result;

        // If any method fails, mark the class and module as failed
        if (!result.success) {
          grouped[moduleName].success = false;
          grouped[moduleName].classes[className].success = false;
        }
      });
    });
  });

  return grouped;
}



function groupTestResults(testResultsMap: Map<string, TestEventResult[]>): GroupedTestResults {
    const grouped: GroupedTestResults = {};
  
    testResultsMap.forEach((testResults, testModule) => {
      testResults.forEach(result => {
        const { className, methodName } = result;
        if (!grouped[testModule]) {
          grouped[testModule] = { classes: {}, success: true }; 
        }
        if (!grouped[testModule].classes[className]) {
          grouped[testModule].classes[className] = { methods: {}, success: true }; 
        }
        grouped[testModule].classes[className].methods[methodName] = result;
  
        // If any method fails, mark the class and module as failed
        if (!result.success) {
          grouped[testModule].success = false;
          grouped[testModule].classes[className].success = false;
        }
      });
    });
  
    return grouped;
  }


        function structureTestResults(testResults) {
  const structuredResults = new Map();

  testResults.forEach(result => {
    const { testModule, className, methodName } = result;

    // Ensure the module exists in the structure
    if (!structuredResults.has(testModule)) {
      structuredResults.set(testModule, new Map());
    }

    const classesMap = structuredResults.get(testModule);

    // Ensure the class exists in the module
    if (!classesMap.has(className)) {
      classesMap.set(className, new Map());
    }

    const methodsMap = classesMap.get(className);

    // Assuming multiple results per method are possible, use an array
    if (!methodsMap.has(methodName)) {
      methodsMap.set(methodName, []);
    }

    methodsMap.get(methodName).push(result);
  });

  return structuredResults;
}

        function groupTestResults(testResults: Map<string, TestEventResult[]>): GroupedTestResults {
    const grouped: GroupedTestResults = {};
    const testResultsArray = Array.from(testResults);
    testResultsArray.forEach(([testModule, results]) => {
      if (!grouped[testModule]) {
        grouped[testModule] = { classes: {}, success: true };
      }
      results.forEach(result => {
        const { className, methodName } = result;
        if (!grouped[testModule].classes[className]) {
          grouped[testModule].classes[className] = { methods: {}, success: true };
        }
        grouped[testModule].classes[className].methods[methodName] = result;

        // If any method fails, mark the class and module as failed
        if (!result.success) {
          grouped[testModule].success = false;
          grouped[testModule].classes[className].success = false;
        }
      });
    });
    return grouped;
}
