import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { encryptedData } = req.body;

  // здесь бэкенд ничего не расшифровывает и не знает ключа
  // для примера просто возвращаем «обработанные» данные
  const processedData = encryptedData.map((row: string[]) =>
    row.map((cell) => `${cell}-processed`)
  );

  return res.json({ processedData });
}