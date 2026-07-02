export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  // Basic validation — Notion IDs are 32 hex characters (with or without hyphens)
  // I am not 100% certain this regex covers every Notion ID format, verify against Notion docs
  const notionIdPattern = /^[a-f0-9-]{32,36}$/i;
  if (!notionIdPattern.test(id)) {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  if (!process.env.NOTION_TOKEN) {
    console.error('NOTION_TOKEN is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
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
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch from Notion' });
    }

    const data = await response.json();

    if (!data.results) {
      return res.status(500).json({ error: 'Unexpected response from Notion' });
    }

    res.status(200).json(data.results);

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
