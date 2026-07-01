export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.NOTION_TOKEN) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/blocks/38d27e5ddaab800e8749f7beb2f88a43/children`,
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
    const pages = data.results.filter(block => block.type === 'child_page');
    res.status(200).json(pages);

  } catch (error) {
    console.error('blogs.js error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
