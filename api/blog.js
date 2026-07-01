export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.NOTION_TOKEN) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }

    const isValidId = /^[a-f0-9-]{32,36}$/.test(id);
    if (!isValidId) {
      return res.status(400).json({ error: 'Invalid id format' });
    }

    const response = await fetch(
      `https://api.notion.com/v1/blocks/${id}/children`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28'
        }
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch from Notion', status: response.status });
    }

    const data = await response.json();
    res.status(200).json(data.results);

  } catch (error) {
    console.error('blog.js error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
