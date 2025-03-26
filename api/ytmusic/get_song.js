export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: "Missing video ID" });

  try {
    const checkResponse = await fetch("https://cnvmp3.com/check_database.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        youtube_id: videoId,
        quality: 1,
        formatValue: 1,
      }),
    });

    const checkData = await checkResponse.json();

    if (checkData.success) {
      res.status(200).json({
        videoId,
        link: checkData.data.server_path,
      });
      return;
    }

    const songData = await fetch(
      `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`
    ).then((res) => res.json());

    const { title } = songData;

    const downloadResponse = await fetch(
      "https://cnvmp3.com/download_video_ucep.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://cnvmp3.com/",
          Origin: "https://cnvmp3.com",
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          quality: 1,
          formatValue: 1,
          title,
        }),
      }
    );

    const downloadData = await downloadResponse.json();

    if (!downloadData.success) {
      console.error(`Failed to download MP3 for ${title}`);
      return res.status(500).json({ error: "Failed to download MP3" });
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
        quality: 1,
        title,
        youtube_id: videoId,
      }),
    });

    res.status(200).json({
      videoId,
      link,
    });
  } catch (error) {
    console.error("YT Music Get Song API error:", error);
    res.status(500).json({ error: error.message });
  }
}
