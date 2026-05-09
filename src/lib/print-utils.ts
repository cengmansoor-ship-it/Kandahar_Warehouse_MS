import i18n from 'i18next';

/**
 * Utility to handle bilingual printing with automatic RTL/LTR detection
 */
export const openPrintWindow = (title: string, content: string, customStyles: string = '') => {
  const lang = i18n.language;
  const isRtl = lang === 'ps';
  const dir = isRtl ? 'rtl' : 'ltr';
  const textAlign = isRtl ? 'right' : 'left';
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return null;

  const html = `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Noto+Sans+Arabic:wght@400;500;700;900&display=swap');
          
          :root {
            --primary-teal: #008080;
          }

          body { 
            font-family: ${isRtl ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif"};
            margin: 0;
            padding: 0;
            background: white;
            color: #1a1d1f;
            line-height: 1.5;
            text-align: ${textAlign};
          }

          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
            @page { margin: 1cm; }
          }

          .print-container {
            padding: 20px;
            max-width: 100%;
          }

          ${customStyles}
        </style>
      </head>
      <body>
        <div class="print-container">
          ${content}
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              // window.close(); // Optional: user might want to keep it open
            }, 800);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  return printWindow;
};

export const getT = (key: string, options?: any) => i18n.t(key, options);
export const isRTL = () => i18n.language === 'ps';
