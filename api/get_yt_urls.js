import { load } from "cheerio";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET")
      return res.status(405).json({ error: "Method Not Allowed" });

    const { videoId } = req.query;
    if (!videoId)
      return res.status(400).json({ error: "Missing videoId parameter" });

    // Stream response instead of waiting for full download
    const pageResponse = await fetch(`https://video.genyt.net/${videoId}`);
    if (!pageResponse.ok)
      throw new Error(`Failed to fetch page: ${pageResponse.statusText}`);

    const reader = pageResponse.body.getReader();
    let pageText = "";
    let mp3has = null,
      mp3sec = null;
    
    // Read the response in chunks
    while (!mp3has || !mp3sec) {
      const { done, value } = await reader.read();
      if (done) break;
      pageText += new TextDecoder().decode(value);

      // Extract mp3has and mp3sec early if found
      mp3has ||= pageText.match(/mp3has\s*=\s*'([^']+)'/)?.[1];
      mp3sec ||= pageText.match(/mp3sec\s*=\s*'([^']+)'/)?.[1];
    }

    if (!mp3has || !mp3sec)
      return res.status(400).json({ error: "Failed to extract mp3 metadata" });

    // Fetch the download links
    const linksResponse = await fetch(
      `https://www.genyt.net/getLinks.php?vid=${videoId}&s=${mp3sec}&h=${mp3has}`
    );
    if (!linksResponse.ok)
      throw new Error(`Failed to get download links: ${linksResponse.statusText}`);

    const linksHtml = await linksResponse.text();
    const $ = load(linksHtml);

    const extractLinks = (filter) =>
      $("a.btn")
        .map((_, el) => $(el).attr("href"))
        .get()
        .filter(filter);

    const video = extractLinks((url) => url.includes("itag=18"));
    const audio = extractLinks((url) => url.includes("mime=audio%2Fwebm"));

    res.status(200).json({
      data: { videoId, urls: { video, audio } },
      status: { success: true, message: "Media URLs found." },
    });
  } catch (error) {
    console.error("[ERROR]", error);
    res.status(500).json({ error: error.message });
  }
}
