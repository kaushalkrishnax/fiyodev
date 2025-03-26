import { memo, useContext } from "react";
import { motion } from "framer-motion";
import MusicContext from "../../context/items/MusicContext";

const TrackItem = memo(({ track, loading }) => {
  const { getTrack, getAdvancedTrack } = useContext(MusicContext);

  const handleClick = async () => {
    if (track?.videoId) {
      await getAdvancedTrack(track?.videoId, {
        name: track?.name,
        artists: track?.artists,
        image: track?.image[1]?.url,
      });
    } else {
      await getTrack(track?.id);
    }
  };

  return (
    <motion.button
      className="flex flex-row w-full mb-3 h-18 items-center justify-start active:scale-99 transition-all duration-50 cursor-pointer"
      onClick={handleClick}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {loading ? (
        <>
          <motion.div className="w-16 h-16 rounded-md bg-gray-300 dark:bg-gray-700 animate-pulse" />
          <div className="flex flex-col px-3 w-2/3">
            <motion.div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-700 rounded-md mb-2 animate-pulse" />
            <motion.div className="h-3 w-1/2 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </>
      ) : (
        <>
          <motion.img
            className="w-16 h-16 rounded-md dark:bg-gray-700 bg-gray-200 object-cover"
            src={track?.image[1]?.url}
            alt="Track"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <div className="flex flex-col px-3 w-2/3">
            <p className="text-md text-start font-medium dark:text-gray-100 text-gray-900 truncate">
              {track?.name.replace(/&quot;/g, '"')}
            </p>
            <p className="text-start text-gray-400 text-xs font-medium truncate">
              {typeof track?.artists === "string"
                ? track?.artists
                : track?.artists?.primary
                    ?.map((artist) => artist.name)
                    .slice(0, 4)
                    .join(", ")
                    .replace(/&quot;/g, '"')}
            </p>
          </div>
        </>
      )}
    </motion.button>
  );
});

const TrackList = memo(({ tracks, loading }) => {
  return (
    <div className="h-screen w-full overflow-y-auto no-scrollbar pb-8">
      {tracks?.length > 0 &&
        tracks?.map((track) => (
          <TrackItem
            key={track?.id || track?.videoId}
            track={track}
            loading={loading}
          />
        ))}
    </div>
  );
});

export default TrackList;
