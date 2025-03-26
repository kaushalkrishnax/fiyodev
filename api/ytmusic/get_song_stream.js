export default async function handler(req, res) {
  const { link } = req.query;
  if (!link) return res.status(400).json({ error: "Missing URL" });

  try {
    const mp3Response = await fetch(link, {
      headers: {
        Referer: "https://cnvmp3.com/",
        Origin: "https://cnvmp3.com",
      },
    });

    if (!mp3Response.ok) {
      return res.status(500).json({ error: "Failed to fetch the file" });
    }

    const buffer = await mp3Response.arrayBuffer();

    res.setHeader("Content-Type", mp3Response.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Content-Disposition", 'attachment; filename="song.mp3"');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Error fetching MP3:", error);
    res.status(500).json({ error: "Failed to fetch the file", stackTrace: error.message });
  }
}
