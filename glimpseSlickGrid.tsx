import React, { useEffect, useRef } from 'react';
import 'slickgrid-react/dist/slickgrid-react.css';
import { SlickGridReact } from 'slickgrid-react';

const GlimpseSlickGrid = ({ data }) => {
  const columns = [
    { id: "filename", name: "Path", field: "filename", width: 200 },
    { id: "lineno", name: "Line", field: "lineno", width: 100, cssClass: 'text-right' },
    { id: "offset", name: "Offset", field: "offset", width: 100, cssClass: 'text-right' },
    { id: "match", name: "Matched", field: "match", width: 400 },
  ];

  const options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    forceFitColumns: true
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <SlickGridReact
        gridId="glimpse-grid"
        columns={columns}
        data={data}
        options={options}
      />
    </div>
  );
};

export default GlimpseSlickGrid;
