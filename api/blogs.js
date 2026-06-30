export default async function handler(req, res) {
  const response = await fetch(
    `https://api.notion.com/v1/blocks/38d27e5ddaab800e8749f7beb2f88a43/children`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    }
  );

  const data = await response.json();
  // Only return child_page blocks (the linked blog pages)
  const pages = data.results.filter(block => block.type === 'child_page');
  res.status(200).json(pages);
}
