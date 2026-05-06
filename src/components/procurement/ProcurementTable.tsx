import React from 'react';

interface TableColumn {
  header: React.ReactNode;
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
    <div className="w-full border-2 border-black mb-6 bg-white overflow-hidden shadow-sm">
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-50 border-b-2 border-black">
            {columns.map((col, idx) => (
              <th 
                key={idx}
                className={`py-3 px-2 border-r-2 border-black font-black text-center last:border-r-0 text-black uppercase tracking-widest`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(data) && data.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-black last:border-b-0 group">
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx}
                  className={`py-3 px-2 border-r-2 border-black last:border-r-0 text-black font-bold h-12 ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-right'
                  }`}
                >
                  <div className="flex items-center justify-center min-h-full">
                    {(() => {
                      const value = col.render ? col.render(row, rowIdx) : row[col.key];
                      if (typeof value === 'number' && isNaN(value)) return '0';
                      return value ?? '-';
                    })()}
                  </div>
                </td>
              ))}
            </tr>
          ))}
          {/* Fill empty rows to make it look official */}
          {Array.isArray(data) && data.length < 8 && Array.from({ length: 8 - data.length }).map((_, i) => (
            <tr key={`empty-${i}`} className="border-b border-black last:border-b-0 h-12">
               {columns.map((_, colIdx) => (
                <td key={colIdx} className="border-r-2 border-black last:border-r-0 bg-slate-50/10"></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
