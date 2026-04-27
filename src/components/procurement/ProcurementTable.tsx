import React from 'react';

interface TableColumn {
  header: string;
  key: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: any, index: number) => React.ReactNode;
}

interface ProcurementTableProps {
  columns: TableColumn[];
  data: any[];
}

export const ProcurementTable: React.FC<ProcurementTableProps> = ({ columns, data }) => {
  return (
    <div className="w-full border-2 border-slate-900 mb-6">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-900">
            {columns.map((col, idx) => (
              <th 
                key={idx}
                className={`py-2 px-1 border-r-2 border-slate-900 font-black text-center last:border-r-0`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(data) && data.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-slate-300 last:border-b-0">
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx}
                  className={`py-2 px-1 border-r-2 border-slate-900 last:border-r-0 whitespace-normal break-words h-10 ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-right px-2'
                  }`}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {/* Empty rows to fill space if needed, following PDF style */}
          {data.length < 5 && Array.from({ length: 5 - data.length }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-slate-300 last:border-b-0 h-10">
               {columns.map((_, colIdx) => (
                <td key={colIdx} className="border-r-2 border-slate-900 last:border-r-0"></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
