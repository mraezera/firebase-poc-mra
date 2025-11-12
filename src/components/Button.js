import React from 'react';

const Button = ({ onClick = null, children = null }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-primary text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-primary-dark transition-colors duration-200"
    >
      {children}
    </button>
  );
};

export default Button;
