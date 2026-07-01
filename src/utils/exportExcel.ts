function escapeHtml(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isNumberValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getColumnTotal(rows: Array<Record<string, unknown>>, header: string) {
  return rows.reduce((sum, row) => {
    const value = row[header];
    return isNumberValue(value) ? sum + value : sum;
  }, 0);
}

export async function exportToExcel(
  fileName: string,
  sheetName: string,
  rows: Array<Record<string, unknown>>,
) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const numericHeaders = headers.filter((header) =>
    rows.some((row) => isNumberValue(row[header])),
  );

  const headerCells = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');

  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => {
            const value = row[header];
            const type = isNumberValue(value) ? 'number' : 'string';
            return `<td style="mso-number-format:'\\@';" data-type="${type}">${escapeHtml(value)}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('');

  const totalRow =
    rows.length && numericHeaders.length
      ? `<tr class="total">${headers
          .map((header, index) => {
            if (index === 0) return '<td>ИТОГО</td>';
            if (numericHeaders.includes(header)) {
              return `<td>${escapeHtml(Math.round(getColumnTotal(rows, header) * 100) / 100)}</td>`;
            }
            return '<td></td>';
          })
          .join('')}</tr>`
      : '';

  const html = `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #eef4ff; font-weight: 700; }
    th, td { border: 1px solid #b8c4d6; padding: 6px 8px; white-space: nowrap; }
    .total td { background: #f5f5f5; font-weight: 700; }
  </style>
</head>
<body>
  <table>
    <caption>${escapeHtml(sheetName)}</caption>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}${totalRow}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${fileName}.xls`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}