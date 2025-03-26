import { useState, useRef, useContext, useEffect } from "react";
import { Sheet } from "react-modal-sheet";
import MusicContext from "../../context/items/MusicContext";
import TrackDeck from "./player/TrackDeck";
import TrackPlayer from "./player/TrackPlayer";
// import MiniTrackPlayer from "./player/MiniTrackPlayer";

const PlayerStack = () => {
  const { currentTrack } = useContext(MusicContext);

  const [isTrackDeckOpen, setIsTrackDeckOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(
    window.matchMedia("(max-width: 1023px)").matches
  );

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.matchMedia("(max-width: 1023px)").matches);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openTrackDeck = () => {
    setIsTrackDeckOpen(true);
  };

  const closeTrackDeck = () => {
    setIsTrackDeckOpen(false);
  };

  return (
    (currentTrack?.id || currentTrack?.videoId) &&
    isTablet && (
      <div className="relative z-10 flex justify-center">
        <Sheet
          isOpen={isTrackDeckOpen}
          onClose={closeTrackDeck}
          className="bg-black/80 md:ml-20 flex justify-center text-black dark:text-white font-SpotifyMedium"
        >
          <Sheet.Container className="w-full h-full min-h-screen">
            <Sheet.Header className="bg-primary-bg dark:bg-primary-bg-dark" />
            <Sheet.Content className="w-full md:px-40 sm:px-20  bg-gradient-to-b from-primary-bg to-body-bg dark:from-primary-bg-dark dark:to-body-bg-dark">
              <TrackDeck />
            </Sheet.Content>
          </Sheet.Container>
          <Sheet.Backdrop />
        </Sheet>
        {!isTrackDeckOpen && <TrackPlayer onOpenTrackDeck={openTrackDeck} />}
      </div>
    )
  );
};

export default PlayerStack;
