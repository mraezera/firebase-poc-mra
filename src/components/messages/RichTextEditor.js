import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { createEditor, Editor } from 'slate';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';

const RichTextEditor = ({ value, onChange, onSubmit, placeholder, editorKey, variant = 'default' }) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [isFocused, setIsFocused] = useState(false);
  const editableRef = useRef(null);

  // Ensure value is never undefined
  const initialValue = value || createEmptySlateValue();

  // Size configurations based on variant
  const sizes = {
    default: {
      containerMinHeight: '48px',
      editableMinHeight: '20px',
      editableMaxHeight: '100px',
    },
    large: {
      containerMinHeight: '48px',
      editableMinHeight: '20px',
      editableMaxHeight: '100px',
    },
  };

  const sizeConfig = sizes[variant] || sizes.default;

  const renderLeaf = useCallback(props => <Leaf {...props} />, []);
  const renderElement = useCallback(props => <Element {...props} />, []);

  // Handle clicking anywhere in the container to focus the editor
  const handleContainerClick = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        try {
          ReactEditor.focus(editor);
          // Move cursor to the end of the content
          const end = Editor.end(editor, []);
          editor.selection = { anchor: end, focus: end };
        } catch (err) {
          console.error('Failed to focus Slate editor:', err);
          // Fallback to direct DOM focus
          try {
            if (editableRef.current) {
              editableRef.current.focus();
            }
          } catch (e) {
            console.error('Failed to focus editor:', e);
          }
        }
      });
    },
    [editor]
  );

  const handleContainerKeyDown = useCallback(
    e => {
      // Only handle Enter or Space if the container itself is focused (not the editor)
      // This prevents interfering with typing in the editor
      if ((e.key === 'Enter' || e.key === ' ') && e.target !== editableRef.current) {
        e.preventDefault();
        handleContainerClick(e);
      }
    },
    [handleContainerClick]
  );

  const handleKeyDown = event => {
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
      role='textbox'
      tabIndex={0}
      onMouseDown={handleContainerClick}
      onKeyDown={handleContainerKeyDown}
      aria-label={placeholder || 'Text editor'}
      aria-multiline='true'
      className={clsx(
        'w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl transition-all cursor-text',
        isFocused && 'ring-2 ring-primary border-transparent'
      )}
      style={{ minHeight: sizeConfig.containerMinHeight }}
    >
      <Slate
        key={editorKey}
        editor={editor}
        initialValue={initialValue}
        onChange={onChange}
      >
        <Editable
          ref={editableRef}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            outline: 'none',
            minHeight: sizeConfig.editableMinHeight,
            maxHeight: sizeConfig.editableMaxHeight,
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
  if (element.type === 'paragraph') {
    return <p {...attributes}>{children}</p>;
  }

  return <p {...attributes}>{children}</p>;
};

// Helper functions to convert Slate to/from plain text
export const serializeSlate = nodes => {
  return nodes.map(n => Node.string(n)).join('\n');
};

export const deserializeSlate = text => {
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

export const isSlateEmpty = nodes => {
  if (!nodes || nodes.length === 0) {
    return true;
  }
  if (nodes.length === 1 && nodes[0].children.length === 1) {
    return nodes[0].children[0].text === '';
  }

  return false;
};

// Helper to convert Slate to plain text for storage
export const slateToPlainText = nodes => {
  if (!nodes || nodes.length === 0) {
    return '';
  }

  return nodes
    .map(n => {
      if (!n.children) {
        return '';
      }

      return n.children.map(child => child.text || '').join('');
    })
    .join('\n');
};

// Helper to convert Slate to JSON string
export const slateToJSON = nodes => {
  return JSON.stringify(nodes);
};

// Helper to parse JSON to Slate
export const jsonToSlate = jsonString => {
  try {
    const parsed = JSON.parse(jsonString);

    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createEmptySlateValue();
  } catch (e) {
    return createEmptySlateValue();
  }
};

// Import Node for serializeSlate
const Node = { string: n => (n.children ? n.children.map(c => c.text || '').join('') : '') };

RichTextEditor.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  placeholder: PropTypes.string,
  editorKey: PropTypes.number,
  variant: PropTypes.oneOf(['default', 'large']),
};

Element.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  element: PropTypes.object.isRequired,
};

Leaf.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  leaf: PropTypes.object.isRequired,
};

export default RichTextEditor;
