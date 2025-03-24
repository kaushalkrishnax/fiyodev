import { createContext, useEffect, useState, useRef } from "react";
import useMusicUtils from "../../hooks/useMusicUtils";

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState({});
  const [loopAudio, setLoopAudio] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isHandlingNextAudioTrack, setIsHandlingNextAudioTrack] =
    useState(false);
  const [previouslyPlayedTracks, setPreviouslyPlayedTracks] = useState([]);
  const [audioProgress, setAudioProgress] = useState({
    position: 0,
    duration: 0,
  });
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const audioRef = useRef(new Audio());

  const MusicUtils = useMusicUtils({
    audioRef,
    currentTrack,
    setCurrentTrack,
    setIsAudioPlaying,
    setIsAudioLoading,
    previouslyPlayedTracks,
    setPreviouslyPlayedTracks,
  });

  useEffect(() => {
    if (isPlayerReady) return;

    const setupPlayer = () => {
      try {
        const audio = audioRef.current;
        audio.preload = "metadata";
        setIsPlayerReady(true);
      } catch (error) {
        console.error("Error setting up Audio:", error);
        setIsPlayerReady(false);
      }
    };

    setupPlayer();
  }, [isPlayerReady]);

  useEffect(() => {
    if (!isPlayerReady) return;

    const audio = audioRef.current;

    const updateProgress = () => {
      try {
        setAudioProgress({
          position: audio.currentTime,
          duration: audio.duration || 0,
        });

        if (
          audio.duration > 0 &&
          audio.currentTime >= audio.duration - 0.01 &&
          !isHandlingNextAudioTrack &&
          !audio.paused
        ) {
          setIsHandlingNextAudioTrack(true);
          if (!loopAudio) {
            MusicUtils.handleNextAudioTrack();
          } else {
            audio.currentTime = 0;
            audio.play();
          }
        }
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    };

    const handlePlay = () => setIsAudioPlaying(true);
    const handlePause = () => setIsAudioPlaying(false);
    const handleLoadStart = () => setIsAudioLoading(true);
    const handleCanPlay = () => setIsAudioLoading(false);
    const handleError = (e) => console.error("Audio error:", e);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    updateProgress();
    const progressInterval = setInterval(updateProgress, 1000);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      clearInterval(progressInterval);
    };
  }, [isAudioPlaying, loopAudio, isPlayerReady]);

  useEffect(() => {
    const playAudio = async () => {
      try {
        if (!currentTrack?.id || !currentTrack?.link) return;

        const audio = audioRef.current;
        audio.src = currentTrack.link;
        audio.load();

        await audio.play();
        setIsAudioPlaying(true);
      } catch (error) {
        console.error(`Error playing track: ${error}`);
      } finally {
        setIsHandlingNextAudioTrack(false);
      }
    };

    playAudio();
  }, [currentTrack?.link]);

  const handleAudioPlay = () => audioRef.current.play();
  const handleAudioPause = () => audioRef.current.pause();
  const handleNextAudioTrack = async () => {
    await MusicUtils.handleNextAudioTrack();
    setIsHandlingNextAudioTrack(false);
  };
  const seekTo = (position) => {
    audioRef.current.currentTime = position;
  };

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        loopAudio,
        setLoopAudio,
        isAudioPlaying,
        setIsAudioPlaying,
        isAudioLoading,
        setIsAudioLoading,
        previouslyPlayedTracks,
        setPreviouslyPlayedTracks,
        audioProgress,
        setAudioProgress,
        handleAudioPlay,
        handleAudioPause,
        handleNextAudioTrack,
        seekTo,
        ...MusicUtils,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export default MusicContext;
