// MP3-player widget for the Music section.
// The LCD shows only album art + track title. Audio comes from a hidden
// Spotify embed that is driven through Spotify's iFrame API (see
// https://developer.spotify.com/documentation/embeds/references/iframe-api),
// so the three physical buttons on the photo — ◀◀ ▶▶ ▶❚❚ — control it.
// Tracks live in data/music.json: { title, artist, uri, cover }.
let musicTracks = [];
let musicIndex = 0;
let musicController = null;
let musicPlaying = false;
let trackEnded = false; // guards against advancing twice for one track end

function musicEls() {
  return {
    art: document.getElementById("mp3-art"),
    title: document.getElementById("mp3-title"),
    mount: document.getElementById("spotify-mount"),
  };
}

function renderTrack() {
  const { art, title } = musicEls();
  const track = musicTracks[musicIndex];
  if (!track || !art || !title) return;
  art.src = track.cover;
  art.alt = track.title;
  title.textContent = track.title;
}

// Moves to another track and starts it (a button press is a user gesture,
// so the browser allows the autoplay).
function goToTrack(delta) {
  if (!musicTracks.length) return;
  musicIndex = (musicIndex + delta + musicTracks.length) % musicTracks.length;
  renderTrack();
  if (!musicController) return;
  musicController.loadUri(musicTracks[musicIndex].uri);
  musicController.play();
}

function togglePlayback() {
  if (musicController) musicController.togglePlay();
}

function initSpotify() {
  const { mount } = musicEls();
  if (!mount || !musicTracks.length) return;

  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrameAPI.createController(
      mount,
      { uri: musicTracks[musicIndex].uri, width: 300, height: 80 },
      (controller) => {
        musicController = controller;
        controller.addListener("playback_update", (e) => {
          const d = e.data;
          musicPlaying = !d.isPaused;
          document.getElementById("mp3")?.classList.toggle("is-playing", musicPlaying);
          // Track finished (the embed just parks at the end) → roll on to the next one.
          if (d.duration > 0 && d.position >= d.duration - 250) {
            if (!trackEnded) {
              trackEnded = true;
              goToTrack(1);
            }
          } else if (d.position < d.duration - 1000) {
            trackEnded = false;
          }
        });
      }
    );
  };

  const script = document.createElement("script");
  script.src = "https://open.spotify.com/embed/iframe-api/v1";
  script.async = true;
  document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("mp3")) return;
  try {
    const res = await fetch(`data/music.json?_=${Date.now()}`);
    musicTracks = await res.json();
  } catch (err) {
    console.error("Failed to load music.json", err);
  }
  renderTrack();
  initSpotify();

  document.getElementById("mp3-prev")?.addEventListener("click", () => goToTrack(-1));
  document.getElementById("mp3-next")?.addEventListener("click", () => goToTrack(1));
  document.getElementById("mp3-play")?.addEventListener("click", togglePlayback);
});
