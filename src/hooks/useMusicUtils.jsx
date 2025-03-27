import { useContext } from "react";
import axios from "axios";
import AppContext from "../context/items/AppContext.jsx";
import { YTMUSIC_BASE_URI } from "../constants.js";

const useMusicUtils = ({
  audioRef,
  currentTrack,
  setContinuation,
  setCurrentTrack,
  setIsAudioPlaying,
  setIsAudioLoading,
  previouslyPlayedTracks,
  setPreviouslyPlayedTracks,
}) => {
  const { contentQuality } = useContext(AppContext);

  /** Search Tracks */
  const searchTracks = async (term, continuation = null) => {
    setContinuation("");
    try {
      const { data } = await axios.get(
        `${YTMUSIC_BASE_URI}/search?term=${encodeURIComponent(term)}&&${
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

  /** Get Track Data */
  const getTrackData = async (videoId) => {
    try {
      const { data } = await axios.get(
        `${YTMUSIC_BASE_URI}/track?videoId=${videoId}`
      );
      const { title, artists, images, duration, urls } = data?.data;

      if (!urls?.audio?.length) {
        const {data} = await axios.get(
          `https://fiyodev.vercel.app/api/get_yt_urls?videoId=${videoId}`
        );
        const { urls } = data?.data;
        return urls;
      }

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
        image: images[3]?.url,
        duration,
        link: urls?.audio?.[getQualityIndex(contentQuality)],
      };
      return trackData;
    } catch (error) {
      console.error(`Error fetching track data: ${error}`);
    }
  };

  /** Get Track */
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

  /** Get suggested track ID */
  const getSuggestedTrackId = async () => {
    try {
      const { data } = await axios.get(
        `${YTMUSIC_BASE_URI}/songs/${currentTrack.id}/suggestions`,
        { params: { limit: 5 } }
      );
      const suggestedTrackIds = data.data.map((item) => item.id);

      const availableTracks = suggestedTrackIds.filter(
        (id) => !previouslyPlayedTracks.includes(id)
      );

      if (availableTracks.length === 0) {
        console.error("No suggested tracks available.");
        return null;
      }

      return availableTracks[
        Math.floor(Math.random() * availableTracks.length)
      ];
    } catch (error) {
      console.error(`Error getSuggestedTrackId: ${error}`);
    }
  };

  /** Handle Audio Play */
  const handleAudioPlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
    }
    setIsAudioPlaying(true);
  };

  /** Handle Audio Pause */
  const handleAudioPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      await audio.pause();
    }
    setIsAudioPlaying(false);
  };

  /** Handle Next Audio Track */
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
