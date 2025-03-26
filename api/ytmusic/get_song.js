import fetch from "node-fetch";
import { Readable } from "stream";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { videoId, contentQuality } = req.query;
  if (!videoId) return res.status(400).json({ error: "Missing video ID" });

  try {
    let qualityIndex = 0;
    switch (contentQuality) {
      case "low":
        qualityIndex = 4;
        break;
      case "normal":
        qualityIndex = 1;
        break;
      default:
        qualityIndex = 0;
    }

    const checkResponse = await fetch("https://cnvmp3.com/check_database.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youtube_id: videoId,
        quality: qualityIndex,
        formatValue: 1,
      }),
    });

    const checkData = await checkResponse.json();

    let mp3Url;
    if (checkData.success) {
      mp3Url = checkData.data.server_path;
    } else {
      const downloadResponse = await fetch("https://cnvmp3.com/download_video_ucep.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          quality: qualityIndex,
          formatValue: 1,
          title: checkData.data?.title || "Unknown Title",
        }),
      });

      const downloadData = await downloadResponse.json();
      if (!downloadData.success) {
        return res.status(500).json({ error: "Failed to download MP3" });
      }

      mp3Url = downloadData.download_link;

      await fetch("https://cnvmp3.com/insert_to_database.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_path: mp3Url,
          formatValue: 1,
          quality: qualityIndex,
          title: checkData.data?.title || "Unknown Title",
          youtube_id: videoId,
        }),
      });
    }

    const mp3Response = await fetch(mp3Url, {
      headers: { Referer: "https://cnvmp3.com/" },
    });

    if (!mp3Response.ok) throw new Error("Failed to fetch MP3 stream");

    const nodeStream = Readable.from(mp3Response.body);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `inline; filename="${videoId}.mp3"`);

    nodeStream.pipe(res);
  } catch (error) {
    console.error("YT Music Get Song API error:", error);
    res.status(500).json({ error: error.message });
  }
}
