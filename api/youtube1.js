export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { term } = req.query;
  if (!term) return res.status(400).json({ error: "Missing search term" });

  try {
    const response = await fetch(
      `https://clients1.google.com/complete/search?client=youtube&hl=en&ds=yt&q=${encodeURIComponent(term)}`
    );

    const textData = await response.text();
    const jsonData = JSON.parse(textData.match(/\[.*\]/)[0]);

    const suggestions = jsonData[1].map((suggestion) => {
      const suggestionText = Array.isArray(suggestion) ? suggestion[0] : suggestion;
      return {
        suggestionText: highlightMatchingText(suggestionText, term),
        suggestionQuery: suggestionText,
      };
    });

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: error.message });
  }
}

function highlightMatchingText(text, term) {
  if (typeof text !== "string") return text;

  const regex = new RegExp(`(${term})`, "gi");
  return text.split(regex).map((part) => ({
    text: part,
    bold: part.toLowerCase() === term.toLowerCase(),
  }));
}
