import React, { useState, useRef, useEffect, useContext } from "react";
import CustomTopNav from "../layout/items/CustomTopNav";
import MusicContext from "../context/items/MusicContext";
import MusicSearchBox from "../components/music/MusicSearchBox";
import TrackList from "../components/music/TrackList";
import TrackDeck from "../components/music/TrackDeck";

const Music = () => {
  const { searchTracks, getTopTracks, currentTrack } = useContext(MusicContext);

  const [tracks, setTracks] = useState([]);

  const [isSearchBoxActive, setIsSearchBoxActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchBoxRef = useRef(null);

  /** Top Tracks */
  useEffect(() => {
    if (!searchQuery) {
      getTopTracks().then((tracks) => setTracks(tracks));
    }
  }, [searchQuery]);

  /** Search Box */
  const openSearchBox = () => {
    setIsSearchBoxActive(true);
    searchBoxRef.current?.focus();
  };

  const closeSearchBox = () => {
    setIsSearchBoxActive(false);
    setSearchQuery("");
  };

  const handleSearch = async (query) => {
    if (!query?.trim()) return;

    setIsLoading(true);
    try {
      const data = await searchTracks(query);
      setTracks(data?.results);
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openSearchBox();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex justify-center mx-auto w-full h-screen font-SpotifyMedium overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full md:px-6 gap-6">
        <div className="flex-1 lg:min-w-1/2">
          <div className="flex flex-col h-full">
            <CustomTopNav
              logoImage={
                !isSearchBoxActive &&
                "https://cdnfiyo.github.io/img/logos/jioSaavn.png"
              }
              className="border-none"
              title={!isSearchBoxActive && "Music"}
              midComponent={
                isSearchBoxActive && (
                  <MusicSearchBox
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchBoxRef={searchBoxRef}
                    closeSearchBox={closeSearchBox}
                    onSearch={handleSearch}
                  />
                )
              }
              rightIcons={
                !isSearchBoxActive
                  ? [
                      {
                        resource: (
                          <i
                            className="fa fa-search text-2xl"
                            aria-hidden="true"
                            title="Search (Ctrl+K)"
                          />
                        ),
                        onClick: openSearchBox,
                      },
                      {
                        resource: (
                          <i className="fa fa-gear text-2xl" title="Settings" />
                        ),
                        onClick: () => {},
                      },
                    ]
                  : []
              }
            />
            {/* Make TrackList scrollable */}
            <div className="flex flex-col px-6 pt-4 gap-4 flex-grow overflow-y-auto">
              <TrackList tracks={tracks} loading={isLoading} />
            </div>
          </div>
        </div>
        <div className="flex-1 hidden lg:block bg-gradient-to-b lg:min-w-1/2">
          <TrackDeck track={tracks[0]} />
        </div>
      </div>
    </div>
  );
};

export default Music;
