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
      if (!song?.playlistItemData?.videoId) continue;

      const id = song?.playlistItemData?.videoId;
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

      try {
        const qualityIndex =
          contentQuality === "low" ? 4 : contentQuality === "normal" ? 1 : 0;

        const checkResponse = await fetch(
          "https://cnvmp3.com/check_database.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              youtube_id: id,
              quality: qualityIndex,
              formatValue: 1,
            }),
          }
        );

        const checkData = await checkResponse.json();

        if (checkData.success) {
          songs.push({
            id,
            name,
            artists,
            playsCount,
            image,
            link: checkData.data.server_path,
          });
          continue;
        }

        const downloadResponse = await fetch(
          "https://cnvmp3.com/download_video_ucep.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: `https://www.youtube.com/watch?v=${id}`,
              quality: qualityIndex,
              formatValue: 1,
              title: name,
            }),
          }
        );

        const downloadData = await downloadResponse.json();

        if (!downloadData.success) {
          console.error(`Failed to download MP3 for ${name}`);
          continue;
        }

        const link = downloadData.download_link;

        await fetch("https://cnvmp3.com/insert_to_database.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            server_path: link,
            formatValue: 1,
            quality: qualityIndex,
            title: name,
            youtube_id: id,
          }),
        });

        songs.push({
          id,
          name,
          artists,
          playsCount,
          image,
          link,
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
