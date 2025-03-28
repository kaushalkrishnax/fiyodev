import axios from "axios";
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
      const { title, artists, images, duration } = data?.data?.track;

      const { data: urlData } = await axios.get(
        `https://fiyodev.vercel.app/api/get_yt_urls?videoId=${videoId}`
      );
      const { urls } = urlData?.data;

      const trackData = {
        videoId,
        title,
        artists,
        image: images[3]?.url,
        duration,
        urls,
        playlistId: data?.data?.playlistId,
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
      const nextTrackId = await axios.get(
        `${YTMUSIC_BASE_URI}/next?videoId=${currentTrack.videoId}&playlistId=${
          currentTrack.playlistId
        }&previouslyPlayedTracks=${previouslyPlayedTracks.join(",")}`
      );
      await getTrack(nextTrackId);
    } catch (error) {
      console.error(`Error handleNextTrack: ${error}`);
    }
  };

  return {
    searchTracks,
    getTrackData,
    getTrack,
    handleAudioPlay,
    handleAudioPause,
    handleNextAudioTrack,
  };
};

export default useMusicUtils;
