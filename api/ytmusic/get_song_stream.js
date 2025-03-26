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

    res.setHeader(
      "Content-Type",
      mp3Response.headers.get("content-type") || "audio/mpeg"
    );
    res.setHeader("Content-Disposition", "attachment; filename=song.mp3");

    const reader = mp3Response.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "audio/mpeg" },
    }).body.pipeTo(res);
  } catch (error) {
    console.error("Stream error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch the file", stackTrace: error.message });
  }
}
