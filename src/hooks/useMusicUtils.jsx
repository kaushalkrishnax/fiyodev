import { useContext } from "react";
import axios from "axios";
import AppContext from "../context/items/AppContext.jsx";
import { FIYOSAAVN_BASE_URI } from "../constants.js";

const useMusicUtils = ({
  audioRef,
  currentTrack,
  setCurrentTrack,
  setIsAudioPlaying,
  setIsAudioLoading,
  previouslyPlayedTracks,
  setPreviouslyPlayedTracks,
}) => {
  const { contentQuality } = useContext(AppContext);

  /** Search Tracks */
  const searchTracks = async (query) => {
    try {
      const { data } = await axios.get(
        `${FIYOSAAVN_BASE_URI}/search/songs?query=${encodeURIComponent(
          query
        )}&limit=50`
      );
      return data.data;
    } catch (error) {
      console.error(`Error searching: ${error}`);
      return [];
    }
  };

  /** Advanced Search Tracks */
  const advancedSearchTracks = async (query, continuation = null) => {
    try {
      const { data } = await axios.get(
        `https://fiyodev.vercel.app/api/ytmusic/search_songs?term=${encodeURIComponent(
          query
        )}&${
          continuation ? `&continuation=${continuation}` : ""
        }&contentQuality=${contentQuality}`
      );
      return data.data;
    } catch (error) {
      console.error(`Error advanced searching: ${error}`);
      return [];
    }
  };

  /** Get Track Data */
  const getTrackData = async (trackId) => {
    try {
      const { data } = await axios.get(
        `${FIYOSAAVN_BASE_URI}/songs/${trackId}`
      );
      const resultData = data.data[0];

      if (!resultData) console.error("Error fetching track data");

      const getQualityIndex = (quality, low, normal, high) =>
        quality === "low" ? low : quality === "normal" ? normal : high;

      const trackData = {
        id: resultData.id,
        name: resultData.name,
        album: resultData.album.name,
        artists: resultData.artists.primary
          .map((artist) => artist.name)
          .join(", "),
        image: resultData.image[2]?.url,
        link: resultData.downloadUrl[getQualityIndex(contentQuality, 0, 3, 4)]
          ?.url,
      };
      return trackData;
    } catch (error) {
      console.error(`Error fetching track data: ${error}`);
    }
  };

  /** Get Track */
  const getTrack = async (trackId) => {
    setIsAudioLoading(true);
    try {
      const fetchedTrackData = await getTrackData(trackId);
      if (!fetchedTrackData) return console.error("Error fetching track data");

      setCurrentTrack(fetchedTrackData);
      setPreviouslyPlayedTracks((prevTracks) => [...prevTracks, trackId]);
    } catch (error) {
      console.error(`Error in getTrack: ${error}`);
    } finally {
      setIsAudioLoading(false);
    }
  };

  /** Get Advanced Track */
  const getAdvancedTrack = async (videoId, { name, artists, image }) => {
    setIsAudioLoading(true);
    try {
      const fetchedTrackData = await fetch(
        `https://fiyodev.vercel.app/api/ytmusic/get_song?id=${videoId}&contentQuality=${contentQuality}`
      );
      if (!fetchedTrackData) return console.error("Error fetching track data");

      setCurrentTrack({
        ...fetchedTrackData,
        name,
        artists,
        image,
      });
      setPreviouslyPlayedTracks((prevTracks) => [...prevTracks, videoId]);
    } catch (error) {
      console.error(`Error in getAdvancedTrack: ${error}`);
    } finally {
      setIsAudioLoading(false);
    }
  };

  /** Get top tracks */
  const getTopTracks = async () => {
    try {
      const { data } = await axios.get(
        `${FIYOSAAVN_BASE_URI}/playlists?id=1134543272&limit=40`
      );
      return data.data.songs;
    } catch (error) {
      console.error("Error fetching top tracks:", error);
      return [];
    }
  };

  /** Get suggested track ID */
  const getSuggestedTrackId = async () => {
    try {
      const { data } = await axios.get(
        `${FIYOSAAVN_BASE_URI}/songs/${currentTrack.id}/suggestions`,
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
    advancedSearchTracks,
    getTrackData,
    getTrack,
    getAdvancedTrack,
    getTopTracks,
    getSuggestedTrackId,
    handleAudioPlay,
    handleAudioPause,
    handleNextAudioTrack,
  };
};

export default useMusicUtils;
