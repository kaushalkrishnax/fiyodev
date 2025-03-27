export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { term, continuation } = req.query;
  if (!term) return res.status(400).json({ error: "Missing search term" });

  try {
    const ytMusicResponse = await fetch(
      `https://music.youtube.com/youtubei/v1/search?${
        continuation ? `continuation=${continuation}&type=next` : ""
      }&prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: term,
          params: "EgWKAQIIAWoSEAMQBBAJEA4QChAFEBEQEBAV", // Search Songs only
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
      throw new Error("YT Music Search Songs API failed");

    const ytMusicData = await ytMusicResponse.json();

    const tracks = [];

    const trackContents =
      ytMusicData?.continuationContents?.musicShelfContinuation?.contents ??
      ytMusicData?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer
        ?.contents;

    const tracksContinuation =
      ytMusicData?.continuationContents?.musicShelfContinuation
        ?.continuations?.[0]?.nextContinuationData?.continuation ??
      ytMusicData?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer
        ?.continuations?.[0]?.nextContinuationData?.continuation;

    for (const { musicResponsiveListItemRenderer: track } of trackContents ||
      []) {
      try {
        if (!track?.playlistItemData?.videoId) continue;

        const videoId = track?.playlistItemData?.videoId;
        const images =
          track?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
        const title =
          track?.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text
            ?.runs?.[0]?.text;
        const artists =
          track?.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
            ?.map((run) => run?.text)
            .join("");
        const playsCount =
          track?.flexColumns[2]?.musicResponsiveListItemFlexColumnRenderer?.text
            ?.runs?.[0]?.text;

        tracks.push({
          videoId,
          title,
          artists,
          playsCount,
          images,
        });
      } catch (error) {
        console.error(`Error processing ${title}:`, error.message);
      }
    }

    res.status(200).json({
      status: { success: true, message: "Tracks found." },
      data: { results: tracks, continuation: tracksContinuation },
    });
  } catch (error) {
    console.error("YT Music API error:", error);
    res.status(500).json({
      status: { success: false, message: "Error fetching tracks." },
      error: error.message,
    });
  }
}
