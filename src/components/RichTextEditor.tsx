// Rich Text Editor Component for Mystical House PKM
// Provides WYSIWYG editing with retro gaming aesthetics

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

interface ToolbarButton {
  icon: string;
  action: () => void;
  title: string;
  active?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your mystical knowledge...",
  className = "",
  autoFocus = false,
  onSave,
  onCancel,
  readOnly = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && editorRef.current && !readOnly) {
      editorRef.current.focus();
    }
  }, [autoFocus, readOnly]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange]);

  // Execute formatting commands
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  }, [handleInput]);

  // Check if command is active
  const isCommandActive = useCallback((command: string) => {
    return document.queryCommandState(command);
  }, []);

  // Get current selection
  const getSelectionText = useCallback(() => {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  }, []);

  // Toolbar buttons
  const toolbarButtons: ToolbarButton[] = [
    {
      icon: '𝐁',
      action: () => executeCommand('bold'),
      title: 'Bold',
      active: isCommandActive('bold')
    },
    {
      icon: '𝐼',
      action: () => executeCommand('italic'),
      title: 'Italic',
      active: isCommandActive('italic')
    },
    {
      icon: '𝐔',
      action: () => executeCommand('underline'),
      title: 'Underline',
      active: isCommandActive('underline')
    },
    {
      icon: '⚡',
      action: () => executeCommand('insertUnorderedList'),
      title: 'Bullet List',
      active: isCommandActive('insertUnorderedList')
    },
    {
      icon: '🔢',
      action: () => executeCommand('insertOrderedList'),
      title: 'Numbered List',
      active: isCommandActive('insertOrderedList')
    },
    {
      icon: '↹',
      action: () => executeCommand('indent'),
      title: 'Increase Indent'
    },
    {
      icon: '↶',
      action: () => executeCommand('outdent'),
      title: 'Decrease Indent'
    },
    {
      icon: '🔗',
      action: () => {
        const url = prompt('Enter URL:');
        if (url) {
          executeCommand('createLink', url);
        }
      },
      title: 'Insert Link'
    },
    {
      icon: '📝',
      action: () => executeCommand('formatBlock', 'blockquote'),
      title: 'Quote'
    }
  ];

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) {
            executeCommand('createLink', url);
          }
          break;
        case 's':
          e.preventDefault();
          onSave?.();
          break;
        case 'enter':
          if (e.shiftKey) {
            e.preventDefault();
            onSave?.();
          }
          break;
      }
    }

    if (e.key === 'Escape') {
      onCancel?.();
    }
  }, [executeCommand, onSave, onCancel]);

  // Show toolbar on selection
  const handleSelectionChange = useCallback(() => {
    const selection = getSelectionText();
    setIsToolbarVisible(selection.length > 0);
  }, [getSelectionText]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  return (
    <div className={`relative ${className}`}>
      {/* Floating Toolbar */}
      <AnimatePresence>
        {isToolbarVisible && !readOnly && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 z-10 bg-purple-900 border-2 border-yellow-400 rounded-lg p-2 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #2D1B69 0%, #1A0B3A 100%)',
              border: '2px solid #F6E05E',
              boxShadow: '0 4px 12px rgba(246, 224, 94, 0.3)'
            }}
          >
            <div className="flex gap-1">
              {toolbarButtons.map((button, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={button.action}
                  className={`px-3 py-1 rounded text-sm font-bold transition-all duration-200 ${
                    button.active
                      ? 'bg-yellow-400 text-purple-900 shadow-inner'
                      : 'bg-purple-800 text-yellow-200 hover:bg-purple-700'
                  }`}
                  title={button.title}
                  style={{
                    backgroundColor: button.active ? '#F6E05E' : '#553C9A',
                    color: button.active ? '#2D1B69' : '#FEFCBF'
                  }}
                >
                  {button.icon}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`min-h-[200px] p-4 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${
          readOnly
            ? 'bg-gray-100 border-gray-300 cursor-default'
            : 'bg-white border-purple-300 focus:border-yellow-400 focus:ring-yellow-200'
        }`}
        style={{
          backgroundColor: readOnly ? '#F7FAFC' : '#FFFFFF',
          borderColor: readOnly ? '#CBD5E0' : '#9F7AEA',
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#2D3748'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Footer with shortcuts */}
      {!readOnly && (
        <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
          <div>
            <span className="font-semibold text-purple-600">Shortcuts:</span>
            <span className="ml-2">Ctrl+B (Bold) • Ctrl+I (Italic) • Ctrl+K (Link) • Ctrl+S (Save) • Shift+Enter (Save) • Esc (Cancel)</span>
          </div>
          {onSave && onCancel && (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Save
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Custom styles for contentEditable */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #A0AEC0;
          font-style: italic;
          pointer-events: none;
        }

        [contenteditable] {
          word-wrap: break-word;
        }

        [contenteditable] * {
          margin: 0;
          padding: 0;
        }

        [contenteditable] p {
          margin-bottom: 1em;
        }

        [contenteditable] blockquote {
          border-left: 4px solid #F6E05E;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #744210;
        }

        [contenteditable] ul, [contenteditable] ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }

        [contenteditable] li {
          margin-bottom: 0.5em;
        }

        [contenteditable] a {
          color: #3182CE;
          text-decoration: underline;
        }

        [contenteditable] a:hover {
          color: #2C5282;
        }

        [contenteditable] strong, [contenteditable] b {
          font-weight: bold;
          color: #2D3748;
        }

        [contenteditable] em, [contenteditable] i {
          font-style: italic;
          color: #744210;
        }

        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;