/**
 * Wrap a function to ensure it doesn't get called more than every x amount of
 * milliseconds.
 */
function throttle(fn: () => void, millis: number): () => void {
  let last = 0;
  let timeout: number | null = null;

  const call = () => {
    timeout = null;
    fn();
    last = new Date().getTime();
  }

  return () => {
    const now = new Date().getTime();
    if (now >= last + millis) {
      call();
    } else if (timeout === null) {
      timeout = window.setTimeout(call, millis);
    }
  };
}

($ => {

  console.log("Inserted contentscript");

  let update_timeout = 0,
  $player = $('#player'),
  lastState: C.PlayState | null = null,
  album_art_url: string | null = null,
  paperSliderObserverSet = false,
  paperSliderValues = {
    value: 0,
    effectiveStartTime: 0,
    max: 0
  };

  // Connect to background script
  const port = chrome.runtime.connect();
  port.onMessage.addListener(msg => {
    console.log('msg', msg);
  });
  const initMessage: C.InitMessage = {
    mode: 'tab'
  };
  port.postMessage(initMessage);

  // Listen for changes in subtree of player
  $player.bind('DOMSubtreeModified', update_state);

  // Listen to mutations of paper-slider for accurate timing
  const paperSliderObserver = new MutationObserver((mutations) => {
    const now = new Date().getTime(); // get current timestamp ASAP
    let slider: Node | null = null;
    for (const m of mutations) {
      if (m.attributeName === 'value') {
        slider = m.target;
        break;
      }
    }
    if (slider) {
      // Record timestamps
      const value = Number(slider.attributes.getNamedItem('value').value);
      paperSliderValues = {
        value,
        effectiveStartTime: now - value,
        max: Number(slider.attributes.getNamedItem('aria-valuemax').value)
      };
    }
    console.log('values:', paperSliderValues);
    update_state();
  });

  function control() {
    // Create closure (on demand) for functions requiring control access
    // (created on demand and disposed of as elems change over the lifetime
    // of page)
    let changed = false;
    const $buttons = $('.material-player-middle:first'),
          $play_pause = $buttons.children('[data-id=play-pause]:first'),
          $next = $buttons.children('[data-id=forward]:first'),
          $prev = $buttons.children('[data-id=rewind]:first'),
          $player_song_info = $('#playerSongInfo'),
          $title = $player_song_info.find('#currently-playing-title'),
          $artist = $player_song_info.find('#player-artist'),
          $album = $player_song_info.find('.player-album:first');

    return {
      update_state: () => {
        // Don't do anything if DOM is in bad state
        if ($player_song_info.children().length === 0)
          return;
        // Setup the paper observer if it is not already
        if (!paperSliderObserverSet) {
          // start the observer
          const target = $('paper-slider').get(0);
          if (target) {
            paperSliderObserver.observe(target, {attributes: true});
            paperSliderObserverSet = true;
          }
        }
        let newState: C.PlayState | null = null;
        if ($player_song_info.is(':visible')) {

          // Meta Info
          const title = $title ? $title.text() : null;
          const artist = $artist ? $artist.text() : null;
          const album = $album ? $album.text() : null;

          // Album Art
          const new_album_art_url = $('#playerBarArt').attr('src');

          if (album_art_url != new_album_art_url) {
            convertImgToBase64(new_album_art_url, base64 => {
              const msg: C.TabMessage = {
                updateAlbumArt: {art: base64}
              };
              port.postMessage(msg)
            }, "image/png");
          }

          album_art_url = new_album_art_url;

          // Play state
          const state: 'playing' | 'paused' = $play_pause.hasClass('playing') ? 'playing' : 'paused';
          const stateValue = state === 'paused' ? paperSliderValues.value : paperSliderValues.effectiveStartTime;

          newState = {
            length: paperSliderValues.max,
            title,
            artist,
            album,
            state,
            stateValue
          };
        }

        if (stateChanged(lastState, newState)) {
          lastState = newState;
          send_state();
        }
      },
      toggle: () => $play_pause.click(),
      next: () => $next.click(),
      prev: () => $prev.click()
    }
  }

  function stateChanged(oldState: C.PlayState | null, newState: C.PlayState | null) {
    // Only one is null -> changed
    if ((oldState === null || newState === null) && oldState !== newState)
      return true;
    // Both non-null -> check properties
    if (oldState !== null && newState !== null) {
      // Check properties changes
      return (
        oldState.length !== newState.length ||
        oldState.state !== newState.state ||
        (
          // If playing, state is different by more than 10 (milliseconds)
          oldState.state === 'playing' && (
            oldState.stateValue < newState.stateValue - 10 ||
            oldState.stateValue > newState.stateValue + 10
          )
        ) ||
        (
          // If paused, state is different at all
          oldState.state === 'paused' &&
          oldState.stateValue != newState.stateValue
        ) ||
        oldState.title !== newState.title ||
        oldState.artist !== newState.artist ||
        oldState.album !== newState.album
      );
    }
    // Both null -> unchanged
    return false;
  }

  function update_state() {
    control().update_state()
  }

  function send_state(){
    const msg: C.TabMessage = {
      updatePlayState: {state: lastState}
    };
    port.postMessage(msg);
  }

  function convertImgToBase64(
    url: string,
    callback: (dataUrl: string) => void,
    outputFormat: "image/png"){
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx === null)
        throw new Error("null context");
      const img = new Image;
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        canvas.height = Math.min(img.height, 62);
        canvas.width = Math.min(img.width, 62);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL(outputFormat);
        callback.call(this, dataURL);
      };
      img.src = url;
    }

  })(jQuery)
