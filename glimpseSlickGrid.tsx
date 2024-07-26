import React, { useContext, useState } from 'react';
import { SlickgridReact, Column, GridOption } from 'slickgrid-react';
import { v4 as uuidv4 } from 'uuid';
import { StyleSheet, css } from 'aphrodite';
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';
import VsCodeExtensionContext, { renderIntoWebview } from '../components/VsCodeExtensionContext';
import FormLabel from '../components/FormLabel';
import { ReviewHistory, ReactViewProps, ReviewSummaryProps } from '../interfaces/interfaces';

const styles = StyleSheet.create({
  descriptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '5px',
    marginBottom: '5px',
  },
  title: {
    margin: '5px 10px',
  },
});

interface ReviewHistoryWithId extends ReviewHistory {
  id?: string;
}

type ReviewHistoryRowProp = {
  history: ReviewHistory[];
};

const ReviewHistoryRow: React.FC<ReviewHistoryRowProp> = ({ history }) => {
  const columns: Column[] = [
    { id: 'status', name: 'Status', field: 'status' },
    { id: 'reviewId', name: 'Id', field: 'reviewId', formatter: (_, __, value) => `<a href="#">${value}</a>` },
    { id: 'description', name: 'Description', field: 'description' },
    { id: 'requestedDate', name: 'Date', field: 'requestedDate' },
    { id: 'requestedBy', name: 'Author', field: 'requestedBy' },
    { id: 'files', name: 'Files', field: 'files', formatter: (_, __, value) => value.map((file: any) => `${file.path} ${file.revision}`).join('\n') },
  ];

  const dataset: ReviewHistoryWithId[] = history.map(h => ({
    ...h,
    reviewId: h.iscurrent ? 'CURRENT' : h.reviewId,
    id: h.id ? h.id : uuidv4(),
  }));

  const gridOptions: GridOption = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    enableSorting: true,
  };

  return (
    <SlickgridReact
      gridId="reviewHistoryGrid"
      columnDefinitions={columns}
      dataset={dataset}
      gridOptions={gridOptions}
    />
  );
};

type ReviewHistoryProp = {
  history: ReviewHistory[];
};

const ReviewHistoryTable: React.FC<ReviewHistoryProp> = ({ history }) => {
  return <ReviewHistoryRow history={history} />;
};

export function VsCodeReviewSummary({ initialData }: ReactViewProps<ReviewSummaryProps>): React.ReactElement {
  const vscodeApi = useContext(VsCodeExtensionContext);
  const { reviewId, history = [] } = initialData;
  const [currentTab, setCurrentTab] = useState<string>('tab_comments');
  const onClickTab = (ev: any) => {
    const element = ev.target as any;
    if (element) {
      setCurrentTab(element.id);
    }
  };

  return (
    <div>
      <div className={css(styles.descriptionHeader)}>
        <FormLabel style={styles.title}>Review Summary</FormLabel>
      </div>
      <VSCodePanels activeId={currentTab}>
        <VSCodePanelTab id="tab_comments" onClick={onClickTab}>Comments</VSCodePanelTab>
        <VSCodePanelTab id="tab_history" onClick={onClickTab}>Review History</VSCodePanelTab>
        <VSCodePanelView id="tab_comments">
          {/* Add your comments tab content here */}
        </VSCodePanelView>
        <VSCodePanelView id="tab_history">
          <ReviewHistoryTable history={history} />
        </VSCodePanelView>
      </VSCodePanels>
    </div>
  );
}

renderIntoWebview(<VsCodeReviewSummary initialData={window.initialData} key={window.id}></VsCodeReviewSummary>);
