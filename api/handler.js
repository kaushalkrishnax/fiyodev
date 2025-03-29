const FLEXIYO_BASE_URI = "https://fiyodev.vercel.app";
const FIYOGQL_BASE_URI = "https://fiyogql.onrender.com/graphql";

/** Fetches song metadata */
const getMusicMetadata = async (videoId) => {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!res.ok) throw new Error("Failed to fetch video data");
    const data = await res.json();

    return data
      ? {
          title: `${data.title} • Flexiyo`,
          description: `By ${data.author_name}`,
          image: data.thumbnail_url,
          ogType: "video.other",
        }
      : null;
  } catch {
    return null;
  }
};

/** Fetches user metadata */
const getUserMetadata = async (username) => {
  try {
    const res = await fetch(FIYOGQL_BASE_URI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ 
          getUser(username: "${username}") { 
            status { success } 
            user { 
              full_name username avatar posts_count followers_count following_count 
            }
          } 
        }`,
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch user data");
    const user = (await res.json())?.data?.getUser?.user;

    return user
      ? {
          title: `${user.full_name} (@${user.username}) • Flexiyo`,
          description: `${user.posts_count} Posts | ${user.followers_count} Followers | ${user.following_count} Following`,
          image: user.avatar,
          ogType: "profile",
        }
      : null;
  } catch {
    return null;
  }
};

/** Generates Open Graph HTML */
const generateMetaHtml = (
  { title, description, image, ogType },
  redirectUrl
) => `
  <html>
  <head>
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${redirectUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:url" content="${redirectUrl}" />
  </head>
  <body>
    <noscript>
      <p>JavaScript is required to view this page properly.</p>
    </noscript>
    <a href="${redirectUrl}" target="_blank" rel="noopener noreferrer" 
       style="font-size:18px; color:blue; text-decoration:underline;">
      Open in External Browser
    </a>
  </body>
</html>
`;

/** API Handler (Only for Bots) */
export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const videoId = url.searchParams.get("track");
  const username = path.startsWith("/u/") ? path.split("/")[2] : null;
  const redirectUrl = `${FLEXIYO_BASE_URI}${path}`;

  let metadata = {
    title: "Flexiyo - Flex in Your Onset",
    description: "Join the ultimate social experience with free music & more.",
    image: "https://cdnfiyo.github.io/img/logos/flexiyo.png",
    ogType: "website",
  };

  if (path === "/music" && videoId) {
    metadata = (await getMusicMetadata(videoId)) || metadata;
  }

  if (path.startsWith("/u/") && username) {
    metadata = (await getUserMetadata(username)) || metadata;
  }

  return new Response(generateMetaHtml(metadata, redirectUrl), {
    headers: { "Content-Type": "text/html" },
  });
}

export const config = { runtime: "edge" };
