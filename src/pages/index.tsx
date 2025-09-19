'use client';

import * as XLSX from 'xlsx';
import { useState } from 'react';
import { generateKeyPair, encryptCell, decryptCell } from '../utils/crypto';

export default function Home() {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicKey, setPublicKey] = useState<CryptoKey | null>(null);
  const [result, setResult] = useState<string[][] | null>(null);

  async function generateKeys() {
    const keyPair = await generateKeyPair();
    setPublicKey(keyPair.publicKey);
    setPrivateKey(keyPair.privateKey);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('handleFile called');
    console.log('File:', e.target.files?.[0]);
    console.log('PublicKey:', publicKey);
    console.log('PrivateKey:', privateKey);
    
    if (!e.target.files?.[0]) {
      console.log('No file selected');
      return;
    }
    if (!publicKey || !privateKey) {
      console.log('Keys not generated yet');
      return;
    }

    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet['!ref']!);

    let targetCol: number | null = null;
    let startRow: number | null = null;

    // 1. найти ячейку "ИИН пациента"
    console.log('Sheet range:', range);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ c, r });
        const cell = sheet[addr];
        if (cell) {
          console.log(`Cell ${addr}:`, cell.v);
        }
        if (cell && typeof cell.v === 'string' && cell.v.replace('-processed', '').trim() === 'ИИН пациента') {
          console.log('Found target column at:', { c, r });
          targetCol = c;
          startRow = r + 1;
          break;
        }
      }
      if (targetCol !== null) break;
    }
    
    console.log('Target column:', targetCol, 'Start row:', startRow);

    // 2. шифруем все ячейки вниз в этой колонке
    if (targetCol !== null && startRow !== null) {
      for (let r = startRow; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ c: targetCol, r });
        const cell = sheet[addr];
        if (cell && cell.v != null && cell.v !== '') {
          cell.v = await encryptCell(String(cell.v), publicKey);
        }
      }ч
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedData: rows }),
    });

    const { processedData } = await res.json();

    const decryptedData = await Promise.all(
      processedData.map((row: string[]) =>
        Promise.all(
          row.map(async (cell) => {
            // пробуем расшифровать — если не получится, просто вернуть как есть
            try {
              return await decryptCell(cell.split('-processed')[0], privateKey);
            } catch {
              return cell;
            }
          })
        )
      )
    );

    setResult(decryptedData);
  }

  return (
    <main style={{ padding: 40 }}>
      <button onClick={generateKeys}>Сгенерировать ключи</button>
      <br /><br />
      <input type="file" onChange={handleFile} />
      <br /><br />
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}