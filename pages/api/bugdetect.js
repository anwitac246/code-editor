import { lintCode } from './utils/lint';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { code = '', language = '' } = req.body;
    const errors = await lintCode(language, code);
    res.status(200).json({ errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
