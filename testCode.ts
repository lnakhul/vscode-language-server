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
