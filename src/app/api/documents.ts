import dbConnect from '@/dbConfig/dbConfig';
import Document from '@/models/Document';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  console.log(method);

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const documents = await Document.find({});
        return res.status(200).json({ success: true, data: documents });
      } catch (error: unknown) {
        console.error('GET /api/document error:', error);
        return res.status(400).json({ success: false, error: 'Failed to fetch documents' });
      }

    case 'POST':
      try {
        const document = await Document.create(req.body);
        return res.status(201).json({ success: true, data: document });
      } catch (error: unknown) {
        console.error('POST /api/document error:', error);
        return res.status(400).json({ success: false, error: 'Failed to create document' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

