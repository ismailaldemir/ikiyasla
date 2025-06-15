const codeCell = XLSX.utils.encode_cell({ c: idxCode1, r: options.headerRow1 + 1 + i });
const priceCell = XLSX.utils.encode_cell({ c: idxPrice1, r: options.headerRow1 + 1 + i });
const nameCell = XLSX.utils.encode_cell({ c: idxName1, r: options.headerRow1 + 1 + i });

isStrikethrough(ws1, codeCell) ||
isStrikethrough(ws1, priceCell) ||
isStrikethrough(ws1, nameCell)