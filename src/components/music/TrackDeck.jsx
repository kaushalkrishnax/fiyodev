import React, { useState, useRef, useEffect, useCallback } from "react";
import { useContext } from "react";
import MusicContext from "../../context/items/MusicContext";

const TrackDeck = () => {
  const {
    handleAudioPlay,
    handleAudioPause,
    handleNextAudioTrack,
    currentTrack,
    audioRef,
    loopAudio,
    setLoopAudio,
    isAudioPlaying,
    isAudioLoading,
    audioProgress,
    setAudioProgress,
  } = useContext(MusicContext);

  const [isDragging, setIsDragging] = useState(false);

  const progressBarRef = useRef(null);

  useEffect(() => {
    const audio = audioRef?.current;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        const newPosition = (audio?.currentTime / audio?.duration) * 100;
        setAudioProgress(newPosition);
      }
    };

    audio?.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [isDragging, setAudioProgress]);

  const handleProgressBarClick = (e) => {
    const audio = audioRef?.current;
    const progressBar = progressBarRef?.current;
    const newPosition = (e.nativeEvent.offsetX / progressBar.clientWidth) * 100;
    setAudioProgress(newPosition);
    audio.currentTime = (newPosition / 100) * audio?.duration;
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (isDragging) {
        const audio = audioRef?.current;
        const progressBar = progressBarRef.current;
        const touchPosition = e.touches[0].clientX;
        const progressBarRect = progressBar.getBoundingClientRect();
        const newPosition =
          ((touchPosition - progressBarRect.left) / progressBarRect.width) *
          100;

        const clampedPosition = Math.max(0, Math.min(100, newPosition));

        setAudioProgress(clampedPosition);
        audio.currentTime = (clampedPosition / 100) * audio?.duration;

        if (
          touchPosition < progressBarRect.left ||
          touchPosition > progressBarRect.right
        ) {
          setIsDragging(false);
        }
      }
    },
    [isDragging, setAudioProgress]
  );

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      const audio = audioRef?.current;
      setIsDragging(false);
      if (isAudioPlaying) {
        audio?.play();
      }
    }
  }, [isDragging, isAudioPlaying, audioRef]);

  useEffect(() => {
    const handleGlobalTouchMove = (e) => {
      handleTouchMove(e);
    };
    const handleGlobalTouchEnd = () => {
      handleTouchEnd();
    };

    document.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  return (
    <div className="flex justify-between items-center flex-col w-full h-screen p-8 bg-gradient-to-b from-primary-bg to-body-bg dark:from-primary-bg-dark dark:to-body-bg-dark">
      <div className="flex flex-col w-full items-center justify-between">
        <img src={currentTrack?.image} alt="" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{currentTrack?.name}</span>
          <span className="text-xs text-gray-500">{currentTrack?.artists}</span>
        </div>
      </div>
      <div className="flex items-center">
        {isAudioLoading ? (
          <i className="fa fa-spinner fa-spin text-2xl" aria-hidden="true" />
        ) : (
          <>
            {isAudioPlaying ? (
              <button onClick={handleAudioPause}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l7-7m0 0l-7-7m7 7H9a6 6 0 000 12h3" />
                </svg>  
              </button>
            ) : (
              <button onClick={handleAudioPlay}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l7-7m0 0l-7-7m7 7H9a6 6 0 000 12h3" />
                </svg>  
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrackDeck;
