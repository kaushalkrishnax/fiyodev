import React, { useState, useRef, useEffect } from "react";

const SearchBox = ({
  searchQuery,
  setSearchQuery,
  searchBoxRef,
  closeSearchBox,
  onSearch,
}) => {
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchAction, setIsSearchAction] = useState(false);
  const searchRef = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(0);

  useEffect(() => {
    if (isSearchAction) {
      setIsSearchAction(false);
      return;
    }
    const timerId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSearchSuggestions(searchQuery);
      }
    }, 200);

    return () => clearTimeout(timerId);
  }, [searchQuery]);

  useEffect(() => {
    const updateWidth = () => {
      if (searchRef.current) {
        setDropdownWidth(searchRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const fetchSearchSuggestions = async (value) => {
    if (!value.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/youtube?term=${encodeURIComponent(value)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      const results = await response.json();
      setSearchSuggestions(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchSuggestions([]);
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchSuggestions([]);
    }
  };

  const handleSearch = (query) => {
    if (query?.trim()) {
      setIsSearchAction(true);
      onSearch?.(query);
      setSearchQuery(query);
      setSearchSuggestions([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      closeSearchBox();
    }
  };

  return (
    <div className="h-full w-full">
      <div
        ref={searchRef}
        className={`flex flex-row items-center w-full bg-secondary-bg dark:bg-secondary-bg-dark pl-2 rounded-t-2xl ${
          !searchSuggestions.length > 0 ? "rounded-b-2xl" : ""
        } transition-shadow`}
        role="search"
      >
        <input
          type="text"
          ref={searchBoxRef}
          className="flex-1 bg-transparent outline-none px-2 placeholder-gray-400 dark:placeholder-gray-500 text-md"
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyPress}
          value={searchQuery}
          placeholder="Search for songs, artists, or albums"
          aria-label="Search music"
          autoFocus
        />
        <div className="flex items-center p-2">
          <button
            onClick={closeSearchBox}
            className="flex justify-center px-2 py-1 bg-red-500 text-white rounded-full cursor-pointer"
            aria-label="Close search"
            title="Close"
            type="button"
          >
            <i className="fa fa-times text-xl" aria-hidden="true" />
          </button>
        </div>
      </div>
      {searchQuery && searchSuggestions.length > 0 && (
        <div
          className="fixed flex-1 bg-secondary-bg dark:bg-secondary-bg-dark border-t-1 border-gray-700 rounded-b-lg shadow-md shadow-gray-200 dark:shadow-gray-800 z-50 max-h-96 overflow-y-auto"
          style={{ width: `${dropdownWidth}px` }}
          role="listbox"
        >
          <div className="flex flex-col">
            {searchSuggestions.map((item, index) => (
              <button
                key={`search-suggestion-${index}`}
                type="button"
                onClick={() => handleSearch(item?.suggestionQuery)}
                className="flex flex-row items-center p-3 w-full rounded-md text-left cursor-pointer"
                role="option"
              >
                <div className="flex flex-row items-center gap-4 w-full">
                  <i
                    className="fa fa-search text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                  />
                  <span className="text-gray-800 dark:text-gray-200 truncate">
                    {item?.suggestionText?.map((part, i) => (
                      <span key={i} className={part?.bold ? "font-bold" : ""}>
                        {part?.text || ""}
                      </span>
                    ))}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;
