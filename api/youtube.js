export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { term } = req.query;
  if (!term) return res.status(400).json({ error: "Missing search term" });

  let suggestions = [];

  try {
    // First attempt: YouTube Music API
    const ytMusicResponse = await fetch(
      "https://music.youtube.com/youtubei/v1/music/get_search_suggestions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: term,
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.2025011",
            },
          },
        }),
      }
    );

    if (!ytMusicResponse.ok) throw new Error("YouTube Music API failed");

    const ytMusicData = await ytMusicResponse.json();
    const suggestionContents =
      ytMusicData?.contents?.[0]?.searchSuggestionsSectionRenderer?.contents;

    suggestionContents?.forEach((content) => {
      const suggestionText =
        content?.searchSuggestionRenderer?.suggestion?.runs?.[0]?.text;
      const suggestionQuery =
        content?.searchSuggestionRenderer?.navigationEndpoint?.searchEndpoint
          ?.query;

      if (suggestionText) {
        suggestions.push({ suggestionText, suggestionQuery });
      }
    });
  } catch (error) {
    console.error("YouTube Music API error:", error);

    try {
      // Fallback: Google's autocomplete API
      const googleResponse = await fetch(
        `https://clients1.google.com/complete/search?client=youtube&hl=en&ds=yt&q=${encodeURIComponent(
          term
        )}`
      );

      if (!googleResponse.ok) throw new Error("Google Autocomplete API failed");

      const textData = await googleResponse.text();
      const jsonData = JSON.parse(textData.match(/\[.*\]/)[0]);

      suggestions = jsonData[1].map((suggestion) => {
        const suggestionText = Array.isArray(suggestion)
          ? suggestion[0]
          : suggestion;
        return {
          suggestionText: highlightMatchingText(suggestionText, term),
          suggestionQuery: suggestionText,
        };
      });
    } catch (fallbackError) {
      console.error("Google Autocomplete API error:", fallbackError);
      return res.status(500).json({ error: "Both APIs failed" });
    }
  }

  res.status(200).json(suggestions.slice(0, 5));
}

function highlightMatchingText(text, term) {
  if (typeof text !== "string") return text;
  const regex = new RegExp(`(${term})`, "gi");
  return text.split(regex).map((part) => ({
    text: part,
    bold: part.toLowerCase() === term.toLowerCase(),
  }));
}
