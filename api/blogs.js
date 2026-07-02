export default async function handler(req, res) {
  if (!process.env.NOTION_TOKEN) {
    console.error('NOTION_TOKEN is not set');
    return res.status(500).json({ error: 'Server configuration error' });
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
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch from Notion' });
    }

    const data = await response.json();

    if (!data.results) {
      return res.status(500).json({ error: 'Unexpected response from Notion' });
    }

    const pages = data.results.filter(block => block.type === 'child_page');
    res.status(200).json(pages);

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}