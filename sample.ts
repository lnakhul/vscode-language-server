// srcdb.tsx (best-effort transcription from the photo)

import React, { useState, useContext } from 'react';
import '@bendera/vscode-webview-elements';
import { VsCodeExtensionContext, renderIntoWebview } from '../components/VsCodeExtensionContext';
import type { ReactViewProps, SrcdbModule, SrcdbViewProps } from '../interfaces/interfaces';

const INDENT_SIZE = 16;

const ModuleTree: React.FC<{ modules: SrcdbModule[]; level?: number }> = ({ modules, level = 0 }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [childrenMap, setChildrenMap] = useState<Record<string, SrcdbModule[]>>({});
  const vscodeApi = useContext(VsCodeExtensionContext);

  const handleExpand = async (mod: SrcdbModule, parentPath?: string /* TODO: confirm */) => {
    if (!expanded[mod.path]) {
      // lazy load children
      if (mod.isDirectory && (!childrenMap[mod.path] || childrenMap[mod.path].length === 0)) {
        const loadedChildren = await vscodeApi.invoke('loadChildren', mod.path);
        setChildrenMap(prev => ({ ...prev, [mod.path]: loadedChildren as SrcdbModule[] }));
      }
    }
    setExpanded(prev => ({ ...prev, [mod.path]: !prev[mod.path] }));
  };

  // Recursively render tree nodes
  const renderTree = (mod: SrcdbModule, parentPath?: string /* TODO: confirm */, idx?: number) => (
    <vscode-tree-item
      key={mod.path}
      data-path={mod.path}
      open={expanded[mod.path]}            // NOTE: likely should be `expanded` attr for vscode-tree-item
      onClick={() => mod.isDirectory && handleExpand(mod, parentPath)}
    >
      {mod.label}

      {mod.isDirectory && expanded[mod.path] && (childrenMap[mod.path]?.length ?? 0) > 0 ? (
        // NOTE: vscode-elements expects nested <vscode-tree-item> directly, not another <vscode-tree>
        <vscode-tree>
          {(childrenMap[mod.path] ?? []).map((child, idxChild) =>
            renderTree(child, /* parent */ mod.path /* TODO: confirm */, idxChild)
          )}
        </vscode-tree>
      ) : null}
    </vscode-tree-item>
  );

  return (
    <vscode-tree>
      {modules.map((mod, idx) => renderTree(mod, /* parent */ undefined, idx))}
    </vscode-tree>
  );
};

export const SrcdbView: React.FC<ReactViewProps<SrcdbViewProps>> = ({ initialData }) => {
  return (
    <>
      <h2>Source Database Modules</h2>
      <ModuleTree modules={initialData.modules} />
    </>
  );
};

renderIntoWebview(<SrcdbView initialData={(window as any).initialData} key={(window as any).id} />);