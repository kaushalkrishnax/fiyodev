import querystring from "querystring";

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
    const response = await fetch(
      `https://music.youtube.com/youtubei/v1/player?prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://music.youtube.com/",
          Origin: "https://music.youtube.com",
          "X-Youtube-Client-Name": "67",
          "X-Youtube-Client-Version": "1.20250317.01.00",
          Cookie: "VISITOR_INFO1_LIVE=leFmjlVfIwc",
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20250317.01.00",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const { videoDetails, streamingData } = data;

    console.log(data);

    if (!streamingData) {
      throw new Error("No streaming data available.");
    }

    const audioStreams = (streamingData.adaptiveFormats || []).filter(
      (format) => format.mimeType.includes("audio")
    );

    const audioUrls = audioStreams
      .map((stream) => {
        if (stream.url) {
          return {
            url: stream.url,
            quality: stream.audioQuality,
            mimeType: stream.mimeType,
          };
        } else if (stream.signatureCipher) {
          const params = querystring.parse(stream.signatureCipher);
          const decodedUrl = params.url
            ? `${params.url}&${params.sp}=${params.s}`
            : null;
          return decodedUrl
            ? {
                url: decodedUrl,
                quality: stream.audioQuality,
                mimeType: stream.mimeType,
              }
            : null;
        }
        return null;
      })
      .filter((url) => url !== null);

    const videoStreams = (streamingData.adaptiveFormats || []).filter(
      (format) => format.mimeType.includes("video")
    );

    const videoUrls = videoStreams
      .map((stream) => {
        if (stream.url) {
          return {
            url: stream.url,
            quality: stream.qualityLabel,
            mimeType: stream.mimeType,
          };
        } else if (stream.signatureCipher) {
          const params = querystring.parse(stream.signatureCipher);
          const decodedUrl = params.url
            ? `${params.url}&${params.sp}=${params.s}`
            : null;
          return decodedUrl
            ? {
                url: decodedUrl,
                quality: stream.qualityLabel,
                mimeType: stream.mimeType,
              }
            : null;
        }
        return null;
      })
      .filter((url) => url !== null);
    const { title, author, lengthSeconds, thumbnail, viewCount } = videoDetails;

    const track = {
      videoId,
      title,
      artists: author.replace("and", ","),
      duration: lengthSeconds,
      images: thumbnail.thumbnails,
      playsCount: viewCount,
      audioUrls,
      videoUrls,
    };

    res.status(200).json({
      status: { success: true, message: "Track found." },
      data: track,
    });
  } catch (error) {
    console.error("YT Music API error:", error);
    res.status(500).json({
      status: { success: false, message: "Error fetching track." },
      error: error.message,
    });
  }
}
