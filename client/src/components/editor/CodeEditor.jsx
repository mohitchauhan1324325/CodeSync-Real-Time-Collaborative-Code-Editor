import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import EditorSkeleton from './EditorSkeleton';

export default function CodeEditor({
  code,
  language = 'javascript',
  onChange,
  onMount,
  onCursorChange,
  remoteCursors = {},
  fontSize = 14,
  minimap = false,
  wordWrap = false,
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const widgetsRef = useRef(new Map());

  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'javascript':
        return 'javascript';
      case 'typescript':
        return 'typescript';
      case 'python':
        return 'python';
      case 'cpp':
        return 'cpp';
      case 'c':
        return 'c';
      case 'java':
        return 'java';
      case 'go':
        return 'go';
      default:
        return 'javascript';
    }
  };

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('codesync-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', background: '0d1117', foreground: 'e6edf3' },
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'regexp', foreground: '7ee787' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'class', foreground: 'ffa657', fontStyle: 'bold' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'e6edf3' },
        { token: 'constant', foreground: '79c0ff' },
        { token: 'delimiter', foreground: '8b949e' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#264f7855',
        'editorCursor.foreground': '#58a6ff',
        'editorWhitespace.foreground': '#21262d',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#c9d1d9',
        'editorGutter.background': '#0d1117',
        'scrollbarSlider.background': '#21262d88',
        'scrollbarSlider.hoverBackground': '#30363d',
        'scrollbarSlider.activeBackground': '#484f58',
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen for local cursor movements and selections
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        const selection = editor.getSelection();
        onCursorChange(e.position, selection);
      }
    });

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  // Render & Synchronize Remote Collaborative Cursors
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const currentSocketIds = new Set(Object.keys(remoteCursors));

    // Remove widgets for users who left
    widgetsRef.current.forEach((widget, socketId) => {
      if (!currentSocketIds.has(socketId)) {
        editor.removeContentWidget(widget);
        widgetsRef.current.delete(socketId);
      }
    });

    // Add or update widgets for active remote users
    Object.entries(remoteCursors).forEach(([socketId, cursorData]) => {
      const { position, user } = cursorData;
      if (!position) return;

      const userColor = user?.color || '#3b82f6';
      const userName = user?.name || 'Peer';

      if (widgetsRef.current.has(socketId)) {
        // Update existing widget position
        const existingWidget = widgetsRef.current.get(socketId);
        existingWidget.currentPosition = position;
        editor.layoutContentWidget(existingWidget);
      } else {
        // Create a new Monaco ContentWidget
        const domNode = document.createElement('div');
        domNode.className = 'remote-cursor-container';
        domNode.style.position = 'absolute';
        domNode.style.pointerEvents = 'none';
        domNode.style.zIndex = '50';

        // Blinking cursor vertical bar
        const cursorBar = document.createElement('div');
        cursorBar.className = 'remote-cursor';
        cursorBar.style.height = `${fontSize + 4}px`;
        cursorBar.style.backgroundColor = userColor;
        domNode.appendChild(cursorBar);

        // Name tag label
        const nameTag = document.createElement('div');
        nameTag.className = 'remote-cursor-label';
        nameTag.style.backgroundColor = userColor;
        nameTag.textContent = userName;
        domNode.appendChild(nameTag);

        const widget = {
          getId: () => `remote-cursor-${socketId}`,
          getDomNode: () => domNode,
          currentPosition: position,
          getPosition: function () {
            return {
              position: this.currentPosition,
              preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
            };
          },
        };

        editor.addContentWidget(widget);
        widgetsRef.current.set(socketId, widget);
      }
    });
  }, [remoteCursors, fontSize]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-dark-900">
      <Editor
        height="100%"
        width="100%"
        language={getMonacoLanguage(language)}
        value={code}
        theme="codesync-dark"
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        onChange={onChange}
        loading={<EditorSkeleton />}
        options={{
          fontSize: fontSize,
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
          fontLigatures: true,
          minimap: { enabled: minimap },
          wordWrap: wordWrap ? 'on' : 'off',
          readOnly: readOnly,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          renderLineHighlight: 'all',
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
