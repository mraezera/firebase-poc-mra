import React from 'react';

const Button = ({ onClick = null, children = null }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#036100] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#034A00] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      {children}
    </button>
  );
};

export default Button;
