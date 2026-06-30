export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const response = await fetch(
    `https://api.notion.com/v1/blocks/${id}/children`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    }
  );

  const data = await response.json();
  res.status(200).json(data.results);
}
