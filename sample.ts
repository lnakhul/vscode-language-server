import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import "@vscode-elements/elements/dist/vscode-tree";
import "@vscode-elements/elements/dist/vscode-tree-item";

import { VsCodeExtensionContext } from "../components/VsCodeExtensionContext"; // you already use this
import type { ReactWebViewProps } from "../interfaces/interfaces";

type SrcdbModule = {
  label: string;
  path: string;          // unique key for each node
  isDirectory: boolean;
  children?: SrcdbModule[]; // may be omitted for lazy nodes
};

type SrcdbViewProps = ReactWebViewProps & {
  modules: SrcdbModule[]; // your initial root payload from extension
};

const INDENT_SIZE = 16;

/** Helps set boolean property `open` on the web component (React would pass a string attr). */
function useTreeItemOpen(ref: React.RefObject<any>, open: boolean) {
  useEffect(() => {
    if (ref.current) ref.current.open = !!open;
  }, [ref, open]);
}

const Node: React.FC<{
  mod: SrcdbModule;
  level: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  childrenMap: Record<string, SrcdbModule[]>;
  setChildrenMap: React.Dispatch<React.SetStateAction<Record<string, SrcdbModule[]>>>;
}> = ({ mod, level, expanded, setExpanded, childrenMap, setChildrenMap }) => {
  const vsc = useContext(VsCodeExtensionContext); // provides vscApi.invoke("loadchildren", path)
  const itemRef = useRef<any>(null);
  const isOpen = !!expanded[mod.path];
  useTreeItemOpen(itemRef, isOpen);

  const hasChildren = mod.isDirectory && (childrenMap[mod.path]?.length ?? 0) > 0;

  const onToggle = async () => {
    if (!mod.isDirectory) return;
    // if first expand and not loaded -> lazy load
    if (!childrenMap[mod.path] || childrenMap[mod.path].length === 0) {
      // your extension side already registers "loadchildren"
      const loaded: SrcdbModule[] = await vsc.invoke("loadchildren", mod.path);
      setChildrenMap(prev => ({ ...prev, [mod.path]: loaded || [] }));
    }
    setExpanded(prev => ({ ...prev, [mod.path]: !prev[mod.path] }));
  };

  const onLabelClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    if (mod.isDirectory) {
      onToggle();
    } else {
      // Optional: open file/module path; wire to your own command if you want
      // vsc.invoke("openSrcdbPath", mod.path);
    }
  };

  return (
    <vscode-tree-item ref={itemRef}>
      {/* "Header" content of this tree row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginLeft: level * INDENT_SIZE,
          cursor: mod.isDirectory ? "pointer" : "default",
          fontWeight: mod.isDirectory ? "bold" as const : "normal" as const,
          color: mod.isDirectory ? "var(--vscode-textLink-foreground)" : undefined,
          textDecoration: mod.isDirectory ? "underline" : undefined,
          userSelect: "none",
          padding: "2px 0",
        }}
        // Let users click the label to expand/collapse directories.
        onClick={onLabelClick}
      >
        <span>{mod.label}</span>
      </div>

      {/* Children */}
      {mod.isDirectory && isOpen && (
        <>
          {/* Loading state: first open with no children yet */}
          {!childrenMap[mod.path] && (
            <vscode-tree-item>
              <div style={{ marginLeft: (level + 1) * INDENT_SIZE, opacity: 0.7 }}>
                Loading…
              </div>
            </vscode-tree-item>
          )}

          {(childrenMap[mod.path] || []).map((child) => (
            <Node
              key={child.path}
              mod={child}
              level={level + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              childrenMap={childrenMap}
              setChildrenMap={setChildrenMap}
            />
          ))}
        </>
      )}
    </vscode-tree-item>
  );
};

const ModuleTree: React.FC<{ modules: SrcdbModule[] }> = ({ modules }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [childrenMap, setChildrenMap] = useState<Record<string, SrcdbModule[]>>({});

  // Open first level by default (optional)
  useEffect(() => {
    const first = modules?.[0]?.path;
    if (first) setExpanded(prev => ({ ...prev, [first]: true }));
  }, [modules]);

  return (
    <vscode-tree expand-mode="doubleClick" /* keeps single-click on label for our handler */
      style={{ display: "block", padding: 0 }}
    >
      {modules.map((m) => (
        <Node
          key={m.path}
          mod={m}
          level={0}
          expanded={expanded}
          setExpanded={setExpanded}
          childrenMap={childrenMap}
          setChildrenMap={setChildrenMap}
        />
      ))}
    </vscode-tree>
  );
};

export const SrcdbView: React.FC<SrcdbViewProps> = ({ modules }) => {
  if (!modules) return null;
  return <ModuleTree modules={modules} />;
};