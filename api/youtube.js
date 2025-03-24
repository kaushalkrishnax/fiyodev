export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { term } = req.query;

  try {
    const response = await fetch(
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

    const data = await response.json();

    delete data?.responseContext;
    delete data?.trackingParams;
    delete data?.contents[1];

    const suggestions = [];

    const suggestionContents =
      data?.contents[0]?.searchSuggestionsSectionRenderer?.contents;

    suggestionContents?.forEach((content) => {
      const suggestionText =
        content?.searchSuggestionRenderer?.suggestion?.runs;
      const suggestionQuery =
        content?.searchSuggestionRenderer?.navigationEndpoint?.searchEndpoint
          ?.query;

      suggestions.push({ suggestionText, suggestionQuery });
    });

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: error.message });
  }
}
