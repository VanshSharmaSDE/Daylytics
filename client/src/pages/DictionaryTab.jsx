import React, { useState } from "react";
import axios from "axios";

const DictionaryTab = () => {
  const [word, setWord] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [hindiTranslation, setHindiTranslation] = useState("");
  const [error, setError] = useState("");

  const searchWord = async (event, lookupWord) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const rawInput = lookupWord ?? word;
    if (!rawInput || !rawInput.trim()) {
      return;
    }

    const trimmedInput = rawInput.trim();
    const searchTerm = trimmedInput.toLowerCase();

    setWord(trimmedInput);
    setSearching(true);
    setError("");
    setResult(null);
    setHindiTranslation("");

    try {
      const dictionaryResponse = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchTerm)}`
      );

      const entries = Array.isArray(dictionaryResponse.data)
        ? dictionaryResponse.data
        : [];

      if (entries.length === 0) {
        throw new Error("NOT_FOUND");
      }

      setResult(entries[0]);

      try {
        const translationResponse = await axios.get(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            trimmedInput
          )}&langpair=en|hi`
        );

        if (translationResponse.data?.responseData?.translatedText) {
          setHindiTranslation(
            translationResponse.data.responseData.translatedText
          );
        }
      } catch (translationError) {
        console.error("Translation error:", translationError);
      }
    } catch (err) {
      console.error("Dictionary API error:", err);

      if (err.message === "NOT_FOUND" || err.response?.status === 404) {
        setError(
          `"${trimmedInput}" not found in the dictionary. Try searching for the base form of the word (e.g., "be" instead of "was").`
        );
      } else if (err.code === "ERR_NETWORK") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Failed to fetch word definition. Please try again.");
      }
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setWord("");
    setResult(null);
    setHindiTranslation("");
    setError("");
  };

  return (
    <div className="dictionary-container">
      {/* Search Card */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h5 className="mb-3">
            <i className="ri-book-open-line me-2 text-primary"></i>
            English-Hindi Dictionary
          </h5>
          <form onSubmit={searchWord} className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search for any word..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={searching || !word.trim()}
            >
              {searching ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                </>
              ) : (
                <>
                  <i className="ri-search-line me-1"></i>Search
                </>
              )}
            </button>
            {(result || error) && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearSearch}
              >
                <i className="ri-close-line"></i>
              </button>
            )}
          </form>
        </div>
      </div>
      {/* Error Message */}
      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="ri-error-warning-line me-2"></i>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card shadow-sm">
          <div className="card-body">
            {/* Word Header */}
            <div className="mb-4">
              <h2 className="mb-2">
                {result.word}
                {result.phonetic && (
                  <span className="text-muted ms-2" style={{ fontSize: "1rem" }}>
                    {result.phonetic}
                  </span>
                )}
              </h2>

              {/* Hindi Translation */}
              {hindiTranslation && (
                <div className="alert alert-info mb-3">
                  <strong>
                    <i className="ri-translate-2 me-2"></i>Hindi:
                  </strong>
                  <span className="ms-2" style={{ fontSize: "1.1rem" }}>
                    {hindiTranslation}
                  </span>
                </div>
              )}

              {/* Audio Pronunciation */}
              {result.phonetics?.find((p) => p.audio) && (
                <div className="mb-3">
                  <audio controls className="w-100">
                    <source
                      src={result.phonetics.find((p) => p.audio).audio}
                      type="audio/mpeg"
                    />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>

            {/* Meanings */}
            {result.meanings?.map((meaning, idx) => (
              <div key={idx} className="mb-4">
                <h5 className="text-primary mb-3">
                  <i className="ri-book-mark-line me-2"></i>
                  {meaning.partOfSpeech}
                </h5>

                {/* Definitions */}
                <div className="mb-3">
                  <h6 className="mb-2">Definitions:</h6>
                  <ol className="ps-3">
                    {meaning.definitions?.map((def, defIdx) => (
                      <li key={defIdx} className="mb-2">
                        <p className="mb-1">{def.definition}</p>
                        {def.example && (
                          <p className="text-muted mb-1">
                            <em>Example: "{def.example}"</em>
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Synonyms */}
                {meaning.synonyms && meaning.synonyms.length > 0 && (
                  <div className="mb-3">
                    <h6 className="mb-2">Synonyms:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {meaning.synonyms.map((synonym, synIdx) => (
                        <span
                          key={synIdx}
                          className="badge bg-success"
                          style={{ fontSize: "0.85rem", cursor: "pointer" }}
                          onClick={() => searchWord(null, synonym)}
                        >
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Antonyms */}
                {meaning.antonyms && meaning.antonyms.length > 0 && (
                  <div className="mb-3">
                    <h6 className="mb-2">Antonyms:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {meaning.antonyms.map((antonym, antIdx) => (
                        <span
                          key={antIdx}
                          className="badge bg-danger"
                          style={{ fontSize: "0.85rem", cursor: "pointer" }}
                          onClick={() => searchWord(null, antonym)}
                        >
                          {antonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {idx < result.meanings.length - 1 && <hr />}
              </div>
            ))}

            {/* Source */}
            {result.sourceUrls && result.sourceUrls.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <small className="text-muted">
                  <i className="ri-links-line me-1"></i>
                  Source:{" "}
                  <a
                    href={result.sourceUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.sourceUrls[0]}
                  </a>
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Card when no search */}
      {!result && !error && !searching && (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <i
              className="ri-book-open-line text-primary mb-3"
              style={{ fontSize: "3rem" }}
            ></i>
            <h5 className="mb-2">Search for any English word</h5>
            <p className="text-muted mb-0">
              Get detailed definitions, examples, synonyms, antonyms, and Hindi
              translations for any word in the English language.
            </p>
            <div className="mt-4">
              <small className="text-muted">
                <i className="ri-information-line me-1"></i>
                Powered by Free Dictionary API & MyMemory Translation
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DictionaryTab;
