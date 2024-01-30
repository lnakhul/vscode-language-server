const groupedResults = testResults.reduce((acc, result) => {
        if (!acc[result.testModule]) {
          acc[result.testModule] = {};
        }
        if (!acc[result.testModule][result.className]) {
          acc[result.testModule][result.className] = {};
        }
        if (!acc[result.testModule][result.className][result.label]) {
          acc[result.testModule][result.className][result.label] = [];
        }
        acc[result.testModule][result.className][result.label].push(result);
        return acc;
      }, {});

 function TestResultsComponent({ data }) {
    if (!data) {
      return null;
    }
  
    if (data instanceof TestEventResult) {
      return (
        <div>
          {data.methodName}: {data.success ? "Passed" : "Failed"}
          {/* Render other details from TestEventResult as needed */}
        </div>
      );
    }
  
    return (
      <div>
        {Object.keys(data).map(key => (
          <div key={key}>
            <strong>{key}</strong>
            <TestResultsComponent data={data[key]} />
          </div>
        ))}
      </div>
    )
            }

            function isTestEventResult(data: any): data is TestEventResult {
    return data && typeof data.success === 'boolean' && typeof data.testModule === 'string' && 
           typeof data.className === 'string' && typeof data.methodName === 'string';
}
