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
              clientVersion: "1.20250317.01.00",
            },
          },
        }),
      }
    );

    if (!ytMusicResponse.ok)
      throw new Error("YT Music Search Suggestions API failed");

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
    console.error("YT Music Search Suggestions API error:", error);
  } finally {
    res.status(200).json(suggestions.slice(0, 5));
  }
}
