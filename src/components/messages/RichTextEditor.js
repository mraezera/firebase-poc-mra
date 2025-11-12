import React, { useCallback, useMemo, useState } from 'react';
import { createEditor, Editor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import clsx from 'clsx';

const RichTextEditor = ({ value, onChange, onSubmit, placeholder }) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [isFocused, setIsFocused] = useState(false);

  // Ensure value is never undefined
  const safeValue = value || createEmptySlateValue();

  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const renderElement = useCallback((props) => <Element {...props} />, []);

  const handleKeyDown = (event) => {
    // Submit on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
      return;
    }

    // Bold
    if (event.ctrlKey && event.key === 'b') {
      event.preventDefault();
      toggleMark(editor, 'bold');
      return;
    }

    // Italic
    if (event.ctrlKey && event.key === 'i') {
      event.preventDefault();
      toggleMark(editor, 'italic');
      return;
    }
  };

  return (
    <div
      className={clsx(
        'w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl transition-all',
        isFocused && 'ring-2 ring-primary border-transparent'
      )}
      style={{ minHeight: '48px' }}
    >
      <Slate editor={editor} initialValue={safeValue} onChange={onChange}>
        <Editable
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            outline: 'none',
            minHeight: '20px',
            maxHeight: '100px',
            overflowY: 'auto',
          }}
        />
      </Slate>
    </div>
  );
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'paragraph':
      return <p {...attributes}>{children}</p>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Helper functions to convert Slate to/from plain text
export const serializeSlate = (nodes) => {
  return nodes.map(n => Node.string(n)).join('\n');
};

export const deserializeSlate = (text) => {
  if (!text || text.trim() === '') {
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  return text.split('\n').map(line => ({
    type: 'paragraph',
    children: [{ text: line }],
  }));
};

export const createEmptySlateValue = () => {
  return [{ type: 'paragraph', children: [{ text: '' }] }];
};

export const isSlateEmpty = (nodes) => {
  if (!nodes || nodes.length === 0) return true;
  if (nodes.length === 1 && nodes[0].children.length === 1) {
    return nodes[0].children[0].text === '';
  }
  return false;
};

// Helper to convert Slate to plain text for storage
export const slateToPlainText = (nodes) => {
  if (!nodes || nodes.length === 0) return '';
  return nodes.map(n => {
    if (!n.children) return '';
    return n.children.map(child => child.text || '').join('');
  }).join('\n');
};

// Helper to convert Slate to JSON string
export const slateToJSON = (nodes) => {
  return JSON.stringify(nodes);
};

// Helper to parse JSON to Slate
export const jsonToSlate = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : createEmptySlateValue();
  } catch (e) {
    return createEmptySlateValue();
  }
};

// Import Node for serializeSlate
const Node = { string: (n) => n.children ? n.children.map(c => c.text || '').join('') : '' };

export default RichTextEditor;
