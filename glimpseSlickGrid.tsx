import ".../css//slickGrid.css";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { SlickgridReact, Column, GridOption, SlickgridReactInstance } from "slickgrid-react";
import { v4 as uuidv4 } from "uuid";
import { LoadingElement } from "./SharedComponents";
import ReactDOM from "react-dom";
import { SlickGridContainer } from "./SlickGridContainer";

// 1) Import your VsCodeExtensionContext that provides vsCodeApi
import VsCodeExtensionContext from "../components/VsCodeExtensionContext";

// 2) Possibly import any interfaces if you have them
import { LoadGridSettingsMessage, SaveGridSettingsMessage } from "../interfaces/interfaces";

export const PathsGrid: React.FC<PathsGridProps> = (props: PathsGridProps) => {
  const { columnOrder, label, imlFiles, rows, onClickPath, loading, loadingLabel, tabPanelId } = props;
  
  // Keep track of column widths in state
  const [columnWidths, setColumnWidths] = useState<{ [colId: string]: number }>({});

  // Access vsCodeApi to invoke extension commands
  const vsCodeApi = useContext(VsCodeExtensionContext);

  const gridRef = useRef<SlickgridReact | null>(null);
  const griId = `path_grid_${label}`;
  const elementId = tabPanelId || griId;

  // On mount, load from extension storage
  useEffect(() => {
    let mounted = true;
    vsCodeApi.invoke("loadGridSettings", { gridId: label } as LoadGridSettingsMessage)
      .then((resp: any) => {
        // e.g. resp might look like { type: 'loadGridSettings', gridId: 'MyGrid', settings: { columnWidths: {...} } }
        if (mounted && resp?.settings?.columnWidths) {
          setColumnWidths(resp.settings.columnWidths);
        }
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, [vsCodeApi, label]);

  // If the data changes, update the slickGrid dataset
  useEffect(() => {
    if (gridRef.current && rows) {
      gridRef.current.dataset = rows;
    }
  }, [rows]);

  // When the grid is created, subscribe to onColumnsResized => update local state + extension storage
  const onGridCreated = useCallback((ev: CustomEvent<SlickgridReactInstance>) => {
    const gridInstance = ev.detail;
    gridRef.current = gridInstance as unknown as SlickgridReact;

    const slickGrid = gridInstance.slickGrid;
    slickGrid.onColumnsResized.subscribe(() => {
      const updatedWidths: Record<string, number> = {};
      slickGrid.getColumns().forEach((c) => {
        updatedWidths[c.id] = c.width ?? c.minWidth ?? 100;
      });
      setColumnWidths(updatedWidths);

      // Save to extension storage
      vsCodeApi.invoke("saveGridSettings", {
        gridId: label,
        settings: { columnWidths: updatedWidths }
      } as SaveGridSettingsMessage);
    });
  }, [vsCodeApi, label]);

  if (!rows || loading) {
    return <LoadingElement label={loadingLabel} />;
  }

  // Create column definitions, applying any loaded widths
  const gridTemplateColumns: Column[] = columnOrder.map((col) => ({
    id: col.key as string,
    name: col.header,
    field: col.key as string,
    width: columnWidths[col.key as string] ?? 100,
    // etc. your custom formatters...
  }));

  const gridOptions: GridOption = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    syncColumnCellResize: true,
    // ...
  };

  return (
    <SlickGridContainer>
      <SlickgridReact
        gridId={griId}
        ref={gridRef}
        columnDefinitions={gridTemplateColumns}
        gridOptions={gridOptions}
        dataset={rows}
        onReactGridCreated={onGridCreated}
      />
    </SlickGridContainer>
  );
};


==========================

const loadGridSettings = useCallback(async () => {
        try {
            const resp = await vsCodeApi.invoke("loadGridSettings", { gridId: label } as LoadGridSettingsMessage);
            if (resp?.settings?.columnWidths) {
                setColumnWidths(resp.settings.columnWidths);
            }
        } catch (error) {
            console.error(error);
        }
    }, [vsCodeApi, label]);

    useEffect(() => {
        loadGridSettings();
    }, [loadGridSettings]);

=================================

useEffect(() => {
        let mounted = true;
        const loadSettings = async () => {
            try {
                const resp = await vsCodeApi.invoke("loadGridSettings", { gridId: label } as LoadGridSettingsMessage);
                if (mounted && resp?.settings?.columnWidths) {
                    setColumnWidths(resp.settings.columnWidths);
                }
            } catch (error) {
                console.error(error);
            }
        };
        loadSettings();
        return () => { mounted = false; };
    }, [vsCodeApi, label]);
