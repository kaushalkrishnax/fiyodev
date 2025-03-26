export default async function handler(req, res) {
  const { link } = req.query;
  if (!link) return res.status(400).json({ error: "Missing URL" });

  try {
    const response = await fetch(link, {
      headers: {
        Referer: "https://cnvmp3.com/",
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
        Origin: "https://cnvmp3.com",
      },
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the file", stackTrace: error });
  }
}
