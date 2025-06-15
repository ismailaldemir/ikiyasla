import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Grid, Button, Box } from '@mui/material';
import * as XLSX from 'xlsx';

interface ExcelUploadProps {
  onFileChange: (file: File) => void;
  label: string;
  onBackendPreview?: (preview: any) => void;
  onSheetNames?: (sheetNames: string[]) => void;
  selectedSheet?: string;
  onSheetChange?: (sheet: string) => void;
  resetTrigger?: number;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onFileChange, label, onBackendPreview, onSheetNames, selectedSheet, onSheetChange, resetTrigger }) => {
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // resetTrigger değiştiğinde dosya adı ve input sıfırlansın
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [resetTrigger]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name); // Dosya adını state'e kaydet
      onFileChange(file); // Dosyayı parent'a ilet
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: 'array' });
          if (onSheetNames) onSheetNames(workbook.SheetNames);
          if (onSheetChange) onSheetChange(workbook.SheetNames[0]);
        }
      };
      reader.readAsArrayBuffer(file);
      if (typeof onBackendPreview === 'function') {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await fetch('http://localhost:3000/excel/preview', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          onBackendPreview(data.preview);
        } catch (err) {
          onBackendPreview(null);
        }
      }
    }
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 3, p: 2, background: '#f9fafb', height: '100%', minWidth: 320, maxWidth: 480, width: 400, boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          {label}
        </Typography>
        <Grid container alignItems="center" spacing={2} sx={{ width: '100%' }}>
          <Grid item xs={12}>
            <Button
              variant="contained"
              component="label"
              sx={{ textTransform: 'none', borderRadius: 2, width: '100%' }}
            >
              Dosya Seç
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                style={{ display: 'none' }}
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </Button>
          </Grid>
          {fileName && (
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mt: 1, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }} title={fileName}>
                Seçilen Dosya: {fileName}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ExcelUpload;
