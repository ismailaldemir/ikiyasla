import React from 'react';

interface NameSelectorProps {
  columns: string[];
  selected: string;
  onChange: (col: string) => void;
  label: string;
}

const NameSelector: React.FC<NameSelectorProps> = ({ columns, selected, onChange, label }) => (
  <label style={{ marginRight: 10 }}>
    {label}
    <select value={selected} onChange={e => onChange(e.target.value)}>
      <option value="">Seçiniz</option>
      {columns.map((col, i) => (
        <option key={i} value={col}>{col}</option>
      ))}
    </select>
  </label>
);

export default NameSelector;
