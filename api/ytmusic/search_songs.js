export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { term, continuation } = req.query;
  if (!term) return res.status(400).json({ error: "Missing search term" });

  let songs = [];
  let songsListContinuation = null;

  try {
    const ytMusicResponse = await fetch(
      `https://music.youtube.com/youtubei/v1/search?${
        continuation ? `continuation=${continuation}&type=next` : ""
      }&prettyPrint=true`,
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

    const songContents =
      ytMusicData?.continuationContents?.musicShelfContinuation?.contents ??
      ytMusicData?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer
        ?.contents;

    songsListContinuation =
      ytMusicData?.continuationContents?.musicShelfContinuation
        ?.continuations?.[0]?.nextContinuationData?.continuation ??
      ytMusicData?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer
        ?.continuations?.[0]?.nextContinuationData?.continuation;

    for (const { musicResponsiveListItemRenderer: song } of songContents ||
      []) {
      try {
        if (!song?.playlistItemData?.videoId) continue;

        const videoId = song?.playlistItemData?.videoId;
        const image =
          song?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
        const name =
          song?.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text
            ?.runs?.[0]?.text;
        const artists =
          song?.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
            ?.map((run) => run?.text)
            .join("");
        const playsCount =
          song?.flexColumns[2]?.musicResponsiveListItemFlexColumnRenderer?.text
            ?.runs?.[0]?.text;

        songs.push({
          videoId,
          name,
          artists,
          playsCount,
          image,
        });
      } catch (error) {
        console.error(`Error processing ${name}:`, error.message);
      }
    }
  } catch (error) {
    console.error("YT Music Search Songs API error:", error);
  } finally {
    res
      .status(200)
      .json({ data: { results: songs, continuation: songsListContinuation } });
  }
}
