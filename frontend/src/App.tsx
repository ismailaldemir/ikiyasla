import React, { useState, useRef, useEffect } from 'react';
import ExcelUpload from './components/ExcelUpload';

import ColumnSelector from './components/ColumnSelector';
import NameSelector from './components/NameSelector';

import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import { Card, CardContent, Typography, Grid, Button, Box, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

import { getExcelPreview } from './utils/excelPreview';
import { exportToExcel, exportToPDF } from './utils/exportUtils';

const App: React.FC = () => {
  // Tüm state tanımları en başta olmalı
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<any[][]>([]);
  const [preview2, setPreview2] = useState<any[][]>([]);
  const [showPreview1, setShowPreview1] = useState(false);
  const [showPreview2, setShowPreview2] = useState(false);
  const [backendPreview1, setBackendPreview1] = useState<any[][]>([]);
  const [backendPreview2, setBackendPreview2] = useState<any[][]>([]);

  // Dinamik seçimler
  const [headerRow1, setHeaderRow1] = useState<number>(0);
  const [headerRow2, setHeaderRow2] = useState<number>(0);

  const [codeCol1, setCodeCol1] = useState<string>('');
  const [priceCol1, setPriceCol1] = useState<string>('');
  const [nameCol1, setNameCol1] = useState<string>('');
  const [codeCol2, setCodeCol2] = useState<string>('');
  const [priceCol2, setPriceCol2] = useState<string>('');
  const [nameCol2, setNameCol2] = useState<string>('');

  // Sheet seçimi için state
  const [sheetNames1, setSheetNames1] = useState<string[]>([]);
  const [sheetNames2, setSheetNames2] = useState<string[]>([]);
  const [selectedSheet1, setSelectedSheet1] = useState<string>('');
  const [selectedSheet2, setSelectedSheet2] = useState<string>('');

  const [fileName1, setFileName1] = useState('');
  const [fileName2, setFileName2] = useState('');

  // Dosya yüklendiğinde, ilk sayfa seçili olarak ayarlanır ve önizleme güncellenir
  const handleFile1 = async (file: File) => {
    setFile1(file);
    // Sheet isimlerini bulmak için ExcelUpload zaten onSheetNames ile setSheetNames1 çağırıyor
    // İlk sayfa seçiliyse önizleme getir
    if (sheetNames1.length > 0) {
      setSelectedSheet1(sheetNames1[0]);
      const data = await getExcelPreview(file, 10, sheetNames1[0]);
      setPreview1(data);
    } else {
      const data = await getExcelPreview(file, 10);
      setPreview1(data);
    }
  };

  const handleFile2 = async (file: File) => {
    setFile2(file);
    if (sheetNames2.length > 0) {
      setSelectedSheet2(sheetNames2[0]);
      const data = await getExcelPreview(file, 10, sheetNames2[0]);
      setPreview2(data);
    } else {
      const data = await getExcelPreview(file, 10);
      setPreview2(data);
    }
  };

  // Önceki Excel dosyası için dosya seçildiğinde sheetNames ve selectedSheet güncelle
  const handleFile1WithStore = async (file: File) => {
    setFile1(file);
    setFileName1(file.name);
    setPreview1([]);
    setSheetNames1([]);
    setSelectedSheet1('');
    // Sheet isimlerini backend'den al
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:3000/excel/preview', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.sheetNames && data.sheetNames.length > 0) {
      setSheetNames1(data.sheetNames);
      setSelectedSheet1(data.sheetNames[0]);
      // Seçili sayfanın preview'unu getir
      getExcelPreview(file, 10, data.sheetNames[0]).then(setPreview1);
    } else {
      setSheetNames1([]);
      setSelectedSheet1('');
      setPreview1(data.preview || []);
    }
  };

  // Güncel Excel dosyası için dosya seçildiğinde sheetNames ve selectedSheet güncelle
  const handleFile2WithStore = async (file: File) => {
    setFile2(file);
    setFileName2(file.name);
    setPreview2([]);
    setSheetNames2([]);
    setSelectedSheet2('');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:3000/excel/preview', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.sheetNames && data.sheetNames.length > 0) {
      setSheetNames2(data.sheetNames);
      setSelectedSheet2(data.sheetNames[0]);
      getExcelPreview(file, 10, data.sheetNames[0]).then(setPreview2);
    } else {
      setSheetNames2([]);
      setSelectedSheet2('');
      setPreview2(data.preview || []);
    }
  };

  // Sayfa seçimi değiştiğinde önizlemeyi ve comboları güncelle
  useEffect(() => {
    if (file1 && selectedSheet1) {
      getExcelPreview(file1, 10, selectedSheet1).then(setPreview1);
    }
  }, [file1, selectedSheet1]);

  useEffect(() => {
    if (file2 && selectedSheet2) {
      getExcelPreview(file2, 10, selectedSheet2).then(setPreview2);
    }
  }, [file2, selectedSheet2]);

  const renderPreview = (data: any[][]) => (
    <table border={1} style={{ marginTop: 10 }}>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Sütun başlıklarını seçmek için yardımcı fonksiyon
  const getColumns = (data: any[][], headerRow: number) => {
    if (!data || !data[headerRow]) return [];
    return data[headerRow].map((cell: any) => String(cell));
  };

  // Karşılaştırma
  const [compareResult, setCompareResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    setError(null);
    setCompareResult([]);
    if (!file1 || !file2) {
      setError('İki dosya da yüklenmeli.');
      return;
    }
    if (!codeCol1 || !priceCol1 || !nameCol1 || !codeCol2 || !priceCol2 || !nameCol2) {
      setError('Tüm sütun seçimleri yapılmalı.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('files', file1);
    formData.append('files', file2);
    formData.append('headerRow1', String(headerRow1));
    formData.append('headerRow2', String(headerRow2));
    formData.append('codeCol1', codeCol1);
    formData.append('priceCol1', priceCol1);
    formData.append('codeCol2', codeCol2);
    formData.append('priceCol2', priceCol2);
    formData.append('nameCol1', nameCol1);
    formData.append('nameCol2', nameCol2);
    try {
      const res = await fetch('http://localhost:3000/excel/compare', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.differences) {
        // Durum etiketi ekle
        const codes1 = new Set(data.differences.map((r: any) => r.code));
        const codes2 = new Set(data.differences.map((r: any) => r.code));
        const allCodes = new Set([...codes1, ...codes2]);
        const resultWithStatus = data.differences.map((row: any) => {
          if (row.price1 !== undefined && row.price2 !== undefined) {
            return { ...row, status: 'changed' };
          } else if (row.price1 !== undefined && (row.price2 === undefined || row.price2 === null)) {
            return { ...row, status: 'deleted' };
          } else if ((row.price1 === undefined || row.price1 === null) && row.price2 !== undefined) {
            return { ...row, status: 'new' };
          } else {
            return { ...row, status: '' };
          }
        });
        setCompareResult(resultWithStatus);
      } else setError('Karşılaştırma sonucu alınamadı.');
    } catch (err) {
      setError('Sunucu hatası.');
    }
    setLoading(false);
  };

  // Excel ve PDF dışa aktarma fonksiyonları
  const handleExportExcel = () => {
    // Excel dışa aktarma işlemi
    if (compareResult && compareResult.length > 0) {
      exportToExcel(compareResult);
    }
  };

  const handleExportPDF = () => {
    // PDF dışa aktarma işlemi
    if (compareResult && compareResult.length > 0) {
      exportToPDF(compareResult);
    }
  };

  // Önizleme gösterimi için handler
  const handleShowPreview1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowPreview1(event.target.checked);
  };

  const handleShowPreview2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowPreview2(event.target.checked);
  };

  // Tüm seçimleri ve sonuçları temizle
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const [resetCounter, setResetCounter] = useState(0);

  // handleClearAll fonksiyonunda state'leri sıfırla
  const handleClearAll = () => {
    setFile1(undefined);
    setFile2(undefined);
    setFileName1('');
    setFileName2('');
    setSheetNames1([]);
    setSheetNames2([]);
    setSelectedSheet1('');
    setSelectedSheet2('');
    setHeaderRow1(1);
    setHeaderRow2(1);
    setCodeCol1('');
    setCodeCol2('');
    setPriceCol1('');
    setPriceCol2('');
    setNameCol1('');
    setNameCol2('');
    setShowPreview1(false);
    setShowPreview2(false);
    setPreviewTable1(null);
    setPreviewTable2(null);
    setCompareResult([]);
    setResetCounter(c => c + 1);
  };

  // Header row select box
  const headerRowSelect1 = (
    <select value={headerRow1} onChange={e => setHeaderRow1(Number(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
      {preview1.map((row, i) => (
        <option key={i} value={i}>{i + 1}. satır</option>
      ))}
    </select>
  );

  const headerRowSelect2 = (
    <select value={headerRow2} onChange={e => setHeaderRow2(Number(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
      {preview2.map((row, i) => (
        <option key={i} value={i}>{i + 1}. satır</option>
      ))}
    </select>
  );

  // Column selectors
  const codeColSelect1 = (
    <ColumnSelector
      columns={getColumns(preview1, headerRow1)}
      selected={codeCol1}
      onChange={setCodeCol1}
      label=""
    />
  );

  const priceColSelect1 = (
    <ColumnSelector
      columns={getColumns(preview1, headerRow1)}
      selected={priceCol1}
      onChange={setPriceCol1}
      label=""
    />
  );

  const nameColSelect1 = (
    <NameSelector
      columns={getColumns(preview1, headerRow1)}
      selected={nameCol1}
      onChange={setNameCol1}
      label=""
    />
  );

  const codeColSelect2 = (
    <ColumnSelector
      columns={getColumns(preview2, headerRow2)}
      selected={codeCol2}
      onChange={setCodeCol2}
      label=""
    />
  );

  const priceColSelect2 = (
    <ColumnSelector
      columns={getColumns(preview2, headerRow2)}
      selected={priceCol2}
      onChange={setPriceCol2}
      label=""
    />
  );

  const nameColSelect2 = (
    <NameSelector
      columns={getColumns(preview2, headerRow2)}
      selected={nameCol2}
      onChange={setNameCol2}
      label=""
    />
  );

  // Önizleme tabloları
  const previewTable1 = showPreview1 && preview1.length > 0 && (
    <div className="overflow-x-auto bg-white rounded shadow p-2 my-2">
      <b>Önizleme (Tarayıcıda):</b>
      {renderPreview(preview1)}
    </div>
  );

  const previewTable2 = showPreview2 && preview2.length > 0 && (
    <div className="overflow-x-auto bg-white rounded shadow p-2 my-2">
      <b>Önizleme (Tarayıcıda):</b>
      {renderPreview(preview2)}
    </div>
  );

  return (
    <div className="container">
      <Box sx={{ maxWidth: 1100, margin: '32px auto 24px auto', width: '100%' }}>
        <Card elevation={3} sx={{ borderRadius: 3, p: 3, background: '#fff', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" fontWeight={900} align="center" color="#1e293b">
              Excel Dosyası Karşılaştırma
            </Typography>
          </Box>
        </Card>
      </Box>
      {/* Önceki Excel Dosyası ve ayarları tek kartta */}
      <Box sx={{ maxWidth: 1100, margin: '0 auto 32px auto', width: '100%' }}>
        <Card elevation={3} sx={{ borderRadius: 3, p: 3, background: '#f9fafb', width: '100%' }}>
          <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Önceki Excel Dosyası
            </Typography>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={3}>
                {/* Dosya seçimi kartı daha dar */}
                <Card className="card" sx={{ minWidth: 180, maxWidth: 260, width: 220, boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CardContent>
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
                        onChange={e => { if (e.target.files && e.target.files[0]) { handleFile1WithStore(e.target.files[0]); } }}
                      />
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={9}>
                {/* Ayar kartı container genişliğinde */}
                <Box sx={{ width: '100%' }}>
                  <Card className="card" sx={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                    <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
                      {fileName1 && (
                        <Typography variant="body2" sx={{ mb: 1, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', display: 'block' }} title={fileName1}>
                          Seçilen Dosya: {fileName1}
                        </Typography>
                      )}
                      {sheetNames1.length > 1 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mr: 1 }}>Sayfa Seçimi:</Typography>
                          <select value={selectedSheet1} onChange={e => setSelectedSheet1(e.target.value)} style={{ minWidth: 120, maxWidth: 180, padding: '6px 10px', borderRadius: 6, border: '1px solid #bfc8d6', fontSize: '1rem' }}>
                            {sheetNames1.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </Box>
                      )}
                      <FormGroup row>
                        <FormControlLabel
                          control={<Checkbox checked={showPreview1} onChange={handleShowPreview1} />}
                          label="Önizleme Göster"
                        />
                      </FormGroup>
                      <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        {/* İlk satır: Başlık Satırı ve Kod */}
                        <Grid item xs={12} sm={6} md={6}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Başlık Satırı:</Typography>
                              <select value={headerRow1} onChange={e => setHeaderRow1(Number(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                {preview1.map((row, i) => (
                                  <option key={i} value={i}>{i + 1}. satır</option>
                                ))}
                              </select>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Kod Sütunu:</Typography>
                              {codeColSelect1}
                            </Box>
                          </Box>
                        </Grid>
                        {/* İkinci satır: Fiyat ve Ad */}
                        <Grid item xs={12} sm={6} md={6}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Fiyat Sütunu:</Typography>
                              {priceColSelect1}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Ad Sütunu:</Typography>
                              {nameColSelect1}
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                      {showPreview1 && previewTable1}
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      {/* Güncel Excel Dosyası ve ayarları tek kartta */}
      <Box sx={{ maxWidth: 1100, margin: '0 auto 32px auto', width: '100%' }}>
        <Card elevation={3} sx={{ borderRadius: 3, p: 3, background: '#f9fafb', width: '100%' }}>
          <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Güncel Excel Dosyası
            </Typography>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={3}>
                <Card className="card" sx={{ minWidth: 180, maxWidth: 260, width: 220, boxSizing: 'border-box', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CardContent>
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
                        onChange={e => { if (e.target.files && e.target.files[0]) { handleFile2WithStore(e.target.files[0]); } }}
                      />
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={9}>
                {/* Ayar kartı container genişliğinde */}
                <Box sx={{ width: '100%' }}>
                  <Card className="card" sx={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                    <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
                      {fileName2 && (
                        <Typography variant="body2" sx={{ mb: 1, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', display: 'block' }} title={fileName2}>
                          Seçilen Dosya: {fileName2}
                        </Typography>
                      )}
                      {sheetNames2.length > 1 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mr: 1 }}>Sayfa Seçimi:</Typography>
                          <select value={selectedSheet2} onChange={e => setSelectedSheet2(e.target.value)} style={{ minWidth: 120, maxWidth: 180, padding: '6px 10px', borderRadius: 6, border: '1px solid #bfc8d6', fontSize: '1rem' }}>
                            {sheetNames2.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </Box>
                      )}
                      <FormGroup row>
                        <FormControlLabel
                          control={<Checkbox checked={showPreview2} onChange={handleShowPreview2} />}
                          label="Önizleme Göster"
                        />
                      </FormGroup>
                      <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6} md={6}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Başlık Satırı:</Typography>
                              <select value={headerRow2} onChange={e => setHeaderRow2(Number(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                {preview2.map((row, i) => (
                                  <option key={i} value={i}>{i + 1}. satır</option>
                                ))}
                              </select>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Kod Sütunu:</Typography>
                              {codeColSelect2}
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Fiyat Sütunu:</Typography>
                              {priceColSelect2}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 120, maxWidth: 180 }}>
                              <Typography variant="subtitle2" fontWeight={600}>Ad Sütunu:</Typography>
                              {nameColSelect2}
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                      {showPreview2 && previewTable2}
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      <div className="mt-8 flex flex-col items-center">
        <Box sx={{ mb: 3 }}>
          <Card elevation={2} sx={{ borderRadius: 3, p: 2, background: '#fff' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>İşlemler</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: 2, fontWeight: 600, px: 4, py: 1, fontSize: 16, width: 'auto', minWidth: 150 }}
                  onClick={handleCompare}
                >
                  Karşılaştır
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  sx={{ borderRadius: 2, fontWeight: 600, px: 3, py: 1, fontSize: 15, width: 'auto', minWidth: 150 }}
                  onClick={handleExportExcel}
                >
                  Excel Olarak İndir
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  sx={{ borderRadius: 2, fontWeight: 600, px: 3, py: 1, fontSize: 15, width: 'auto', minWidth: 150 }}
                  onClick={handleExportPDF}
                >
                  PDF Olarak İndir
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ borderRadius: 2, fontWeight: 600, px: 3, py: 1, fontSize: 15, width: 'auto', minWidth: 150 }}
                  onClick={handleClearAll}
                >
                  Temizle
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Card elevation={2} sx={{ borderRadius: 3, p: 2, background: '#fff' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Sonuçlar</Typography>
              <div className="mt-8">
                {error && <div className="text-red-600 font-semibold mt-4">{error}</div>}
                {compareResult.length > 0 && (
                  <div className="mt-8">
                    <div className="bg-white rounded shadow p-2">
                      <DataGrid
                        autoHeight
                        rows={compareResult.map((row, i) => ({ id: i, ...row }))}
                        columns={[
                          { field: 'code', headerName: 'Kod', flex: 1, minWidth: 120 },
                          { field: 'name', headerName: 'Ad', flex: 1, minWidth: 160 },
                          { field: 'price1', headerName: 'Fiyat 1', flex: 1, minWidth: 100 },
                          { field: 'price2', headerName: 'Fiyat 2', flex: 1, minWidth: 100 },
                          {
                            field: 'status',
                            headerName: 'Durum',
                            flex: 1,
                            minWidth: 140,
                            renderCell: (params: GridRenderCellParams) => {
                              if (params.value === 'changed') return <Chip label="Fiyat Değişmiş" color="warning" size="small" />;
                              if (params.value === 'new') return <Chip label="Yeni Eklendi" color="success" size="small" />;
                              if (params.value === 'deleted') return <Chip label="Silinmiş" color="error" size="small" />;
                              if (params.value === 'strikethrough-deleted') return <Chip label="Üstü Çizili Silinmiş" color="error" size="small" sx={{ textDecoration: 'line-through', fontWeight: 700, background: '#e53e3e', color: '#fff' }} />;
                              return null;
                            },
                          },
                        ] as GridColDef[]}
                        pageSize={10}
                        rowsPerPageOptions={[10, 20, 50]}
                        disableSelectionOnClick
                        className="text-gray-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Box>
      </div>
    </div>
  );
};

export default App;
