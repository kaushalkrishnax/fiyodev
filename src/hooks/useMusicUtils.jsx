import { useContext } from "react";
import axios from "axios";
import { openDB } from "idb";
import AppContext from "../context/items/AppContext.jsx";
import { YTMUSIC_BASE_URI } from "../constants.js";

const useMusicUtils = ({
  audioRef,
  setContinuation,
  setCurrentTrack,
  setIsAudioPlaying,
  setIsAudioLoading,
  setPreviouslyPlayedTracks,
}) => {
  const { contentQuality } = useContext(AppContext);

  const openDatabase = async () => {
    return openDB("MusicCacheDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("tracks")) {
          db.createObjectStore("tracks", { keyPath: "videoId" });
        }
      },
    });
  };

  const searchTracks = async (term, continuation = null) => {
    setContinuation("");
    try {
      const { data } = await axios.get(
        `${YTMUSIC_BASE_URI}/search?term=${encodeURIComponent(term)}${
          continuation ? `&continuation=${continuation}` : ""
        }`
      );

      setContinuation(data.data?.continuation);
      return data.data?.results;
    } catch (error) {
      console.error(`Error searching: ${error}`);
      return [];
    }
  };

  const getTrackData = async (videoId) => {
    const db = await openDatabase();
    const cachedTrack = await db.get("tracks", videoId);

    if (
      cachedTrack &&
      cachedTrack.createdAt &&
      new Date(cachedTrack.createdAt).getTime() + 6 * 60 * 60 * 1000 >
        new Date().getTime()
    ) {
      return cachedTrack;
    }

    try {
      const { data } = await axios.get(
        `${YTMUSIC_BASE_URI}/track?videoId=${videoId}`
      );
      const { title, artists, images, duration } = data?.data;

      const { data: urlData } = await axios.get(
        `https://fiyodev.vercel.app/api/get_yt_urls?videoId=${videoId}`
      );

      const urls = urlData?.data?.urls;

      const getQualityIndex = (quality) => {
        switch (quality) {
          case "low":
            return 2;
          case "normal":
            return 1;
          case "high":
            return 0;
          default:
            return 0;
        }
      };

      const trackData = {
        videoId,
        title,
        artists,
        image: images?.[3]?.url || images?.[0]?.url,
        duration,
        link: urls?.audio?.[getQualityIndex(contentQuality)],
        createdAt: new Date(),
      };

      await db.put("tracks", trackData);

      return trackData;
    } catch (error) {
      console.error(`Error fetching track data: ${error}`);
      return null;
    }
  };

  const getTrack = async (videoId) => {
    setIsAudioLoading(true);
    try {
      const fetchedTrackData = await getTrackData(videoId);
      if (!fetchedTrackData) return console.error("Error fetching track data");

      setCurrentTrack(fetchedTrackData);
      setPreviouslyPlayedTracks((prevTracks) => [...prevTracks, videoId]);
    } catch (error) {
      console.error(`Error in getTrack: ${error}`);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const getSuggestedTrackId = async () => {
    try {
      return null;
    } catch (error) {
      console.error(`Error getSuggestedTrackId: ${error}`);
    }
  };

  const handleAudioPlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
    }
    setIsAudioPlaying(true);
  };

  const handleAudioPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      await audio.pause();
    }
    setIsAudioPlaying(false);
  };

  const handleNextAudioTrack = async () => {
    try {
      const nextTrackId = await getSuggestedTrackId();
      await getTrack(nextTrackId);
    } catch (error) {
      console.error(`Error handleNextTrack: ${error}`);
    }
  };

  return {
    searchTracks,
    getTrackData,
    getTrack,
    getSuggestedTrackId,
    handleAudioPlay,
    handleAudioPause,
    handleNextAudioTrack,
  };
};

export default useMusicUtils;
