import React from 'react';

// Component to render rich text (Slate JSON) as HTML
function RichTextRenderer({ content }) {
  // If content is a string, try to parse as JSON
  let nodes;
  try {
    nodes = typeof content === 'string' ? JSON.parse(content) : content;
  } catch (e) {
    // If parsing fails, treat as plain text
    return <span>{content}</span>;
  }

  if (!Array.isArray(nodes)) {
    return <span>{content}</span>;
  }

  return (
    <div className="whitespace-pre-wrap break-words">
      {nodes.map((node, index) => (
        <Element key={index} element={node} />
      ))}
    </div>
  );
}

const Element = ({ element }) => {
  if (!element.children) {
    return null;
  }

  const children = element.children.map((child, index) => (
    <Leaf key={index} leaf={child} />
  ));

  switch (element.type) {
    case 'paragraph':
      return <p className="text-sm">{children}</p>;
    default:
      return <p className="text-sm">{children}</p>;
  }
};

const Leaf = ({ leaf }) => {
  let children = leaf.text || '';

  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span>{children}</span>;
};

export default RichTextRenderer;
