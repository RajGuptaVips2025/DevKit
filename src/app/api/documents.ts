import dbConnect from '@/dbConfig/dbConfig';
import Document from '@/models/Document';
import type { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  console.log("kjbkb   ",method)

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const documents = await Document.find({});
        res.status(200).json({ success: true, data: documents });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case 'POST':
      try {
        const document = await Document.create(req.body);
        res.status(201).json({ success: true, data: document });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
