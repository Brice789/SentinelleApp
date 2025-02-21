export function Table({ children }) {
    return <table className="border-collapse border border-gray-300 w-full">{children}</table>;
  }
  
  export function Thead({ children }) {
    return <thead className="bg-gray-100">{children}</thead>;
  }
  
  export function Tbody({ children }) {
    return <tbody>{children}</tbody>;
  }
  
  export function Tr({ children }) {
    return <tr className="border-b">{children}</tr>;
  }
  
  export function Th({ children }) {
    return <th className="px-4 py-2 text-left font-semibold">{children}</th>;
  }
  
  export function Td({ children }) {
    return <td className="px-4 py-2">{children}</td>;
  }
  