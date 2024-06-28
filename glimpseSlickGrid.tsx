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



import React, { useState, useContext, useRef } from 'react';
import { VsCodeExtensionContext, renderIntoWebview, useExtensionCommand, usePersistentState } from '../components/VsCodeExtensionContext';
import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { GlimpseSearchProps, SearchResult } from '../shared/src/interfaces';
import FormLabel from '../components/FormLabel';
import GlimpseSlickGrid from './GlimpseSlickGrid'; // Import the new SlickGrid component

// Your existing styles and other constants...

const initialState = {
  searchText: '',
  fileNameFilter: '',
  repo: glimpseRepositories[0].repo,
  pageIndex: 0,
  results: [],
  currentHistoryIndex: -1
};

// Other initial states...

export function GlimpseSearch({ initialData }: ReactViewProps<GlimpseSearchProps>) {
  const vscodeApi = useContext(VsCodeExtensionContext);
  const [previousSearchHistory, updatePreviousSearchHistory] = usePersistentState<GlimpseSearchProps>('previousSearchTerms', initialData);
  const [searchItemHistory, searchItemHistoryMapping] = previousSearchHistory;
  const [selectedResult, setSelectedResult] = useState<number | undefined>();
  const [toggleState, updateToggleState] = usePersistentState<GlimpseToggleSearchState>('glimpseSearchState', initialToggleState);
  const [state, updateState] = usePersistentState<GlimpseSearchState>('glimpse', initialState);
  const [inputValue, updateInputValue] = useState<string>(state.searchText);
  const filterRef = useRef<any>();
  const { ignoreCase, isRegex, wholeWords, linenoMode } = toggleState;

  let initialSummary: string | undefined;
  if (state.results.length > 0) {
    const { results, pageIndex } = state;
    initialSummary = (results.length > PAGE_LIMIT) ? `Displaying ${pageIndex + 1}-${pageIndex + PAGE_LIMIT} of ${results.length} results found` : `${results.length} results found`;
  }
  const [resultsSummary, setResultsSummary] = useState<string | undefined>(initialSummary);

  // Existing functions...

  return (
    <div style={{ margin: 0, minWidth: "500px" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--vscode-sideBar-background)", padding: 4 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, margin: "0px 8px" }}>
          <VSCodeTextField placeholder="Search Term (\u2191\u2193 for history)" value={inputValue} onKeyUp={onEnter} onInput={onInput as any} onChange={onChange as any}>
            <section slot="end" style={textFieldSectionEndStyle}>
              <VSCodeButton appearance="Icon" title="Match Case" aria-label="Match Case"
                style={ignoreCase ? uncheckedIconStyle : checkedIconStyle} role="checkbox" aria-checked={ignoreCase} onClick={(evt: React.MouseEvent) => updateToggleState({ ignoreCase: !ignoreCase })}>
                <span className="codicon codicon-case-sensitive"></span>
              </VSCodeButton>
              <VSCodeButton appearance="icon" title="Match whole Word" aria-label="Match whole word"
                style={wholeWords ? checkedIconStyle : uncheckedIconStyle} role="checkbox" aria-checked={wholeWords} onClick={(evt: React.MouseEvent) => updateToggleState({ wholeWords: !wholeWords })}>
                <span className="codicon codicon-whole-word"></span>
              </VSCodeButton>
              <VSCodeButton appearance="icon" title="Use Regular Expression" aria-label="Use Regular Expression"
                style={isRegex ? checkedIconStyle : uncheckedIconStyle} role="checkbox" aria-checked={isRegex} onClick={(evt: React.MouseEvent) => updateToggleState({ isRegex: !isRegex })}>
                <span className="codicon codicon-regex"></span>
              </VSCodeButton>
              <VSCodeButton appearance="icon" title="Search with line record on (-n)" aria-label="Search with line record (-n)"
                style={linenoMode ? checkedIconStyle : uncheckedIconStyle} role="checkbox" aria-checked={linenoMode} onClick={(evt: React.MouseEvent) => updateToggleState({ linenoMode: !linenoMode })}>
                <span className="codicon codicon-list-ordered"></span>
              </VSCodeButton>
            </section>
          </VSCodeTextField>
          <VSCodeTextField ref={filterRef} placeholder="Path Filter" value={state.fileNameFilter} onKeyUp={onEnter} onChange={onFilterChange as any} />
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <VSCodeButton style={{ marginRight: 10 }} onClick={doSearch} disabled={searchDisabled}>Search</VSCodeButton>
            <VSCodeDropdown currentValue={state.repo} onChange={dropdownChanged as any}>
              {
                glimpseRepositories.map(repo => <VSCodeOption title={repo.label} key={repo.repo} value={repo.repo}>{repo.label}</VSCodeOption>)
              }
            </VSCodeDropdown>
            {
              state.results.length > PAGE_LIMIT ? (
                <span>
                  <VSCodeButton title={`Show previous ${PAGE_LIMIT} result`} disabled={state.pageIndex === 0} aria-label="Previous page result"
                    onClick={onClickPageBackward} appearance="icon"><span className="codicon codicon-triangle-left"></span></VSCodeButton>
                  <VSCodeButton title={`Show next ${PAGE_LIMIT} result`} disabled={state.pageIndex + PAGE_LIMIT >= state.results.length} aria-label="Next page result" onClick={onClickPageForward} appearance="icon"><span className="codicon codicon-triangle-right"></span></VSCodeButton>
                </span>
              ) : undefined
            }
          </div>
          {resultsSummary ? <FormLabel>{resultsSummary}</FormLabel> : undefined}
          {/* Replace the existing grid with the new SlickGrid component */}
          <GlimpseSlickGrid data={state.results.slice(state.pageIndex, state.pageIndex + PAGE_LIMIT)} />
        </div>
      </div>
    </div>
  );
}

renderIntoWebview(<GlimpseSearch initialData={window.initialData} key={window.id}></GlimpseSearch>);




/* slickgrid-vscode-themes.css */

/* Common SlickGrid Styles */
.slickgrid-container {
  width: 100%;
  height: 100%;
}

/* Light Theme */
.vscode-light .slickgrid-container {
  --slickgrid-background: #ffffff;
  --slickgrid-text-color: #000000;
  --slickgrid-header-background: #f3f3f3;
  --slickgrid-border-color: #e0e0e0;
}

/* Dark Theme */
.vscode-dark .slickgrid-container {
  --slickgrid-background: #1e1e1e;
  --slickgrid-text-color: #d4d4d4;
  --slickgrid-header-background: #3c3c3c;
  --slickgrid-border-color: #454545;
}

/* High Contrast Light Theme */
.vscode-high-contrast-light .slickgrid-container {
  --slickgrid-background: #ffffff;
  --slickgrid-text-color: #000000;
  --slickgrid-header-background: #f3f3f3;
  --slickgrid-border-color: #ff0000; /* Example color */
}

/* High Contrast Dark Theme */
.vscode-high-contrast .slickgrid-container {
  --slickgrid-background: #000000;
  --slickgrid-text-color: #ffffff;
  --slickgrid-header-background: #2c2c2c;
  --slickgrid-border-color: #ff0000; /* Example color */
}

/* Applying the CSS variables to SlickGrid */
.slickgrid-container .slick-header {
  background-color: var(--slickgrid-header-background);
  color: var(--slickgrid-text-color);
}

.slickgrid-container .slick-viewport,
.slickgrid-container .slick-row {
  background-color: var(--slickgrid-background);
  color: var(--slickgrid-text-color);
}

.slickgrid-container .slick-cell {
  border-right: 1px solid var(--slickgrid-border-color);
}

.slickgrid-container .slick-header-column {
  border-right: 1px solid var(--slickgrid-border-color);
}


private _fuzzySearchPosition(text: string, match: string, offset: number): number {
    const preText = text.substring(0, offset);
    const postText = text.substring(offset);
    
    const preMatchPosition = preText.lastIndexOf(match);
    const postMatchPosition = postText.indexOf(match);
    
    console.log(`preMatchPosition: ${preMatchPosition}, postMatchPosition: ${postMatchPosition}`);
    
    let position;
    
    if (preMatchPosition !== -1 && postMatchPosition !== -1) {
        // Find which match is closer to the offset
        const preDistance = offset - (preMatchPosition + match.length);
        const postDistance = postMatchPosition;
        
        position = preDistance <= postDistance ? preMatchPosition : (offset + postMatchPosition);
    } else if (preMatchPosition !== -1) {
        position = preMatchPosition;
    } else if (postMatchPosition !== -1) {
        position = offset + postMatchPosition;
    } else {
        position = offset;
    }
    
    console.log(`computed position: ${position}`);
    
    return position;
}


private _fuzzySearchPosition(text: string, match: string, offset: number): number {
    let position = offset - match.length;
    const offset0 = text.indexOf(match, position);
    const offset1 = text.lastIndexOf(match, position + match.length);
    if (offset0 == -1 && offset1 != -1) {
        position = offset1;
    } else if (offset0 != -1 && offset1 == -1) {
        position = offset0;
    } else if (offset0 != -1 && offset1 != -1) {
        position = (offset0 - position) < (position - offset1) ? offset0 : offset1;
    }
    return position !== -1 ? position : offset;
}

private _fuzzySearchPosition(text: string, match: string, offset: number, linenoMode: boolean): number {
    let position = offset - (linenoMode ? match.length : 0);
    const offset0 = text.indexOf(match, position);
    const offset1 = text.lastIndexOf(match, position + match.length);
    if (offset0 == -1 && offset1 != -1) {
        position = offset1;
    } else if (offset0 != -1 && offset1 == -1) {
        position = offset0;
    } else if (offset0 != -1 && offset1 != -1) {
        position = (offset0 - position) < (position - offset1) ? offset0 : offset1;
    }
    return position;
}



useEffect(() => {
        if (searchItemHistory.length > 0 && !state.hasUniqueIds) {
            const newSearchItemHistory = searchItemHistory.map(searchItem => ({ ...searchItem, id: searchItem.id || uuidv4() }));
            updatePreviousSearchHistory({ searchItemHistory: newSearchItemHistory, searchItemHistoryMapping });
            updateState({ hasUniqueIds: true });
        }
    }, [searchItemHistory, searchItemHistoryMapping, state.hasUniqueIds]);
