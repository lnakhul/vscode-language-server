import React, { useState, useContext } from 'react';
import VsCodeExtensionContext, { renderIntoWebview } from '../components/VsCodeExtensionContext';
import type { ReactViewProps, SrcdbModule, SrcdbViewProps } from '../interfaces/interfaces';

const INDENT_SIZE = 16;

const ModuleTree: React.FC<{ modules: SrcdbModule[]; level?: number }> = ({ modules, level = 0 }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [childrenMap, setChildrenMap] = useState<Record<string, SrcdbModule[]>>({});
  const vsCodeApi = useContext(VsCodeExtensionContext);

  const handleExpand = async (mod: SrcdbModule) => {
    if (!expanded[mod.path]) {
      if (mod.isDirectory && (!childrenMap[mod.path] || childrenMap[mod.path].length === 0)) {
        const loadedChildren = await vsCodeApi.invoke("loadChildren", mod.path);
        setChildrenMap(prev => ({ ...prev, [mod.path]: loadedChildren as SrcdbModule[] }));
      }
    }
    setExpanded(prev => ({ ...prev, [mod.path]: !prev[mod.path] }));
  };

  return (
    <ul style={{ marginLeft: level * INDENT_SIZE }}>
      {modules.map(mod => (
        <li key={mod.path}>
          <span
            style={{
              cursor: mod.isDirectory ? 'pointer' : 'default',
              fontWeight: mod.isDirectory ? 'bold' : 'normal',
              color: mod.isDirectory ? 'var(--vscode-textLink-foreground)' : undefined,
              textDecoration: mod.isDirectory ? 'underline' : undefined
            }}
            onClick={() => handleExpand(mod)}
          >
            {mod.label}
          </span>
          {mod.isDirectory && expanded[mod.path] && (childrenMap[mod.path]?.length ?? 0) > 0 && (
            <ModuleTree modules={childrenMap[mod.path]} level={level + 1} />
          )}
        </li>
      ))}
    </ul>
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

renderIntoWebview(<SrcdbView initialData={window.initialData} key={window.id} />);