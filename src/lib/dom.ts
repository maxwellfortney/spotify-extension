import { TrackInfo, Token, Device, RepeatMode } from './interface';
import {
  pause as pauseTrack,
  next as nextTrack,
  prev as prevTrack,
  play as playTrack,
  saveTrack,
  removeTrack,
  repeat,
  setVolume,
} from './spotify';
import ColorThief from 'colorthief';
import { updateTrackCache, updateTrackInfo } from './utils';
import { DEFAULT_SCROLL_DELTA } from './constants';

const LIMIT = 128;
const BOX_SHADOW = '10px 0px 20px 15px';
const DEFAULT_DARK_PALETTE = [31, 64, 104];
const DEFAULT_LIGHT_PALETTE = [244, 244, 244];
const TIME_OUT = 200;

export function displayTrackInfo(playback: TrackInfo) {
  const songTitle = document.getElementById('title');
  const artistName = document.getElementById('artist');
  const coverImage = document.getElementById('cover-photo-wrapper');
  const infoBox = document.getElementById('information-box');
  const prevIcon = document.getElementById('prev-icon');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const nextIcon = document.getElementById('next-icon');
  const repeatIcon = document.getElementById('repeat-icon');
  const repeatContext = document.getElementById('repeat-context');
  const repeatOne = document.getElementById('repeat-one');
  const divider = document.getElementById('divider');
  const volumeIcon = document.getElementById('volume-icon');
  const volumeMutedIcon = document.getElementById('volume-muted-icon');

  const { title, artist, coverPhoto, trackUrl } = playback;

  if (title) {
    songTitle.textContent = title;
    songTitle.setAttribute('title', title);
    songTitle.setAttribute('href', trackUrl);
    songTitle.setAttribute('target', '_blank');
    songTitle.style.textDecoration = 'none';
    songTitle.style.fontWeight = 'bold';
  }

  if (artist) {
    artistName.textContent = artist.name;
    artistName.setAttribute('title', artist.name);
    artistName.setAttribute('href', artist.url);
    artistName.setAttribute('target', '_blank');
    artistName.style.textDecoration = 'none';
    artistName.style.fontStyle = 'italic';
  }

  if (coverPhoto) {
    const img = document.createElement('img');
    img.setAttribute('src', coverPhoto);
    img.setAttribute('id', 'cover-photo');
    img.setAttribute('class', 'mini-spotify-right-panel mini-spotify-cover-photo');
    img.setAttribute('title', `${title} - ${artist.name}`);
    img.setAttribute('alt', `${title} - ${artist.name}`);

    if (document.getElementById('cover-photo')) {
      coverImage.removeChild(document.getElementById('cover-photo'));
    }

    coverImage.append(img);

    if (img.complete) {
      const { background, text } = getColors();
      const textRGB = `rgb(${text[0]}, ${text[1]}, ${text[2]})`;
      const bgRGB = `rgb(${background[0]}, ${background[1]}, ${background[2]})`;

      songTitle.style.color = textRGB;
      artistName.style.color = textRGB;
      prevIcon.style.fill = textRGB;
      playIcon.style.fill = textRGB;
      pauseIcon.style.fill = textRGB;
      nextIcon.style.fill = textRGB;
      repeatIcon.style.fill = textRGB;
      repeatOne.style.backgroundColor = textRGB;
      repeatOne.style.color = bgRGB;
      repeatContext.style.backgroundColor = textRGB;
      infoBox.style.backgroundColor = bgRGB;
      infoBox.style.boxShadow = `${BOX_SHADOW} ${bgRGB}`;
      divider.style.backgroundColor = textRGB;
      renderSaveButton(playback, textRGB);
      volumeIcon.style.color = textRGB;
      volumeMutedIcon.style.color = textRGB;
    } else {
      img.addEventListener('load', function () {
        const { background, text } = getColors();
        const textRGB = `rgb(${text[0]}, ${text[1]}, ${text[2]})`;
        const bgRGB = `rgb(${background[0]}, ${background[1]}, ${background[2]})`;

        songTitle.style.color = textRGB;
        artistName.style.color = textRGB;
        prevIcon.style.fill = textRGB;
        playIcon.style.fill = textRGB;
        pauseIcon.style.fill = textRGB;
        nextIcon.style.fill = textRGB;
        repeatIcon.style.fill = textRGB;
        repeatOne.style.backgroundColor = textRGB;
        repeatOne.style.color = bgRGB;
        repeatContext.style.backgroundColor = textRGB;
        infoBox.style.backgroundColor = bgRGB;
        infoBox.style.boxShadow = `${BOX_SHADOW} ${bgRGB}`;
        divider.style.backgroundColor = textRGB;
        renderSaveButton(playback, textRGB);
        volumeIcon.style.color = textRGB;
        volumeMutedIcon.style.color = textRGB;
      });
    }
  }

  renderRepeatBadge(playback);
}

function renderSaveButton(playback: TrackInfo, color) {
  const save = document.getElementById('save');
  const unSave = document.getElementById('un-save');

  const saveIcon = document.getElementById('save-icon');
  const unSaveIcon = document.getElementById('un-save-icon');

  const type = playback.isSave === true ? 'save' : 'un-save';

  switch (type) {
    case 'un-save':
      save.style.display = 'flex';
      saveIcon.style.fill = color;
      unSave.style.display = 'none';
      break;
    case 'save':
      save.style.display = 'none';
      unSave.style.display = 'flex';
      unSaveIcon.style.fill = color;
      break;
  }
}

function renderRepeatBadge(playback: TrackInfo) {
  const repeatContext = document.getElementById('repeat-context');
  const repeatOne = document.getElementById('repeat-one');

  switch (playback.repeatState) {
    case 'track':
      repeatContext.style.display = 'flex';
      repeatOne.style.display = 'flex';
      break;
    case 'context':
      repeatContext.style.display = 'flex';
      repeatOne.style.display = 'none';
      break;
    default:
      repeatContext.style.display = 'none';
      repeatOne.style.display = 'none';
      break;
  }
}

function getColors() {
  const img = document.getElementById('cover-photo');
  const result = {
    text: '',
    background: '',
  };

  // FireFox security
  const colorThief = new ColorThief();
  let palette;

  img.setAttribute('crossOrigin', 'Anonymous');

  // in case the image is not fully loaded
  if (!(img as HTMLImageElement).complete) {
    return result;
  }

  // FireFox security
  try {
    palette = colorThief.getPalette(img);
  } catch (e) {
    if (e.name !== 'SecurityError') {
      throw e;
    }
  }

  if (!palette) {
    return result;
  }

  const mainColor = palette[0];

  const mode = getModeOfColor(mainColor[0], mainColor[1], mainColor[2]);

  const darkColorsIndex = [];
  const lightColorsIndex = [];

  // start with the second palette
  // because the first one is the main palette
  for (let i = 1; i < palette.length; i++) {
    const [red, green, blue] = palette[i];
    if (getMeanColors(red, green, blue) > LIMIT) {
      lightColorsIndex.push(i);
    } else {
      darkColorsIndex.push(i);
    }
  }

  let textColor;

  switch (mode) {
    case 'dark':
      textColor = palette[lightColorsIndex[0]] || DEFAULT_LIGHT_PALETTE;
      break;
    case 'light':
      textColor = palette[darkColorsIndex[0]] || DEFAULT_DARK_PALETTE;
      break;
  }

  result.background = mainColor;
  result.text = textColor;

  return result;
}

function getModeOfColor(red, green, blue): 'dark' | 'light' {
  const mean = getMeanColors(red, green, blue);
  return mean < LIMIT ? 'dark' : 'light';
}

function getMeanColors(red, green, blue) {
  return (red + green + blue) / 3;
}

export function displayControlButtons(mode: ButtonType) {
  const btnPause = document.getElementById('pause');
  const btnPlay = document.getElementById('play');

  switch (mode) {
    case 'play':
      btnPlay.style.display = 'inline-flex';
      btnPause.style.display = 'none';
      break;
    case 'pause':
      btnPlay.style.display = 'none';
      btnPause.style.display = 'inline-flex';
      break;
  }
}

export function displayVolumeControl(volumePercent: number, shouldSetInputValue: boolean) {
  const volumeSlider = document.getElementById('volume') as HTMLInputElement;
  const volumeIcon = document.getElementById('volume-icon');
  const volumeMutedIcon = document.getElementById('volume-muted-icon');

  if (volumePercent === 0 && volumeIcon && volumeMutedIcon) {
    volumeMutedIcon.classList.remove('mini-spotify-volume-button-hide');
    volumeIcon.classList.add('mini-spotify-volume-button-hide');
  } else if (volumeIcon && volumeMutedIcon) {
    volumeMutedIcon.classList.add('mini-spotify-volume-button-hide');
    volumeIcon.classList.remove('mini-spotify-volume-button-hide');
  }

  if (shouldSetInputValue && volumeSlider) {
    volumeSlider.value = volumePercent.toString();
  }
}

export function displayBox(mode: BoxType) {
  const player = document.getElementById('spotify-mini-player');
  const notification = document.getElementById('spotify-mini-player-notification');
  const loginNotification = document.getElementById('spotify-mini-player-login-notification');

  switch (mode) {
    case 'player':
      player.style.display = 'flex';
      notification.style.display = 'none';
      loginNotification.style.display = 'none';
      break;
    case 'no-device-open-notification':
      player.style.display = 'none';
      notification.style.display = 'flex';
      loginNotification.style.display = 'none';
      break;
    case 'login-notification':
      player.style.display = 'none';
      notification.style.display = 'none';
      loginNotification.style.display = 'flex';
      break;
  }
}

export function registerEvents(token: Token, device: Device, playback: TrackInfo, render: () => Promise<void>) {
  const btnPrev = document.getElementById('prev');
  const btnPause = document.getElementById('pause');
  const btnPlay = document.getElementById('play');
  const btnNext = document.getElementById('next');
  const btnSave = document.getElementById('save');
  const btnUnSave = document.getElementById('un-save');
  const btnRepeat = document.getElementById('repeat');
  const volumeSlider = document.getElementById('volume') as HTMLInputElement;
  const volumeIcon = document.getElementById('volume-icon');
  const volumeMutedIcon = document.getElementById('volume-muted-icon');
  const volumeContainer = document.getElementById('volume-container');

  // Initialize a debounce timer in order to prevent excessive PUT requests to Spotify API on all onmousemove events
  let debounceTimer = null;
  let savedVolume = device.volumePercent;

  // Necessary to keep showing the volume slider if the user is changing the volume with wheel
  let hideVolumeTimout = null;
  let hideVolumeSubTimout = null;

  document.addEventListener('wheel', async (e) => {
    const inputVal = parseInt(volumeSlider.value);

    volumeSlider.classList.add('mini-spotify-left-panel-volume-expand');
    volumeSlider.classList.remove('mini-spotify-left-panel-volume-hidden');

    // Show the slider for 1000ms, then hide the slider
    if (hideVolumeTimout) clearTimeout(hideVolumeTimout);
    if (hideVolumeSubTimout) clearTimeout(hideVolumeSubTimout);

    hideVolumeTimout = setTimeout(() => {
      volumeSlider.classList.remove('mini-spotify-left-panel-volume-expand');
      hideVolumeSubTimout = setTimeout(() => {
        volumeSlider.classList.add('mini-spotify-left-panel-volume-hidden');
      }, 350);
    }, 1000);

    e.preventDefault();
    if (e.deltaY > 0) {
      //Wheen down
      if (inputVal - DEFAULT_SCROLL_DELTA <= 0) {
        displayVolumeControl(0, true);
        await setVolume(0, token.accessToken);
      } else {
        displayVolumeControl(inputVal - DEFAULT_SCROLL_DELTA, true);
        await setVolume(inputVal - DEFAULT_SCROLL_DELTA, token.accessToken);
      }
    } else if (e.deltaY < 0) {
      //Wheel Up
      if (inputVal + DEFAULT_SCROLL_DELTA >= 100) {
        displayVolumeControl(100, true);
        await setVolume(100, token.accessToken);
      } else {
        displayVolumeControl(inputVal + DEFAULT_SCROLL_DELTA, true);
        await setVolume(inputVal + DEFAULT_SCROLL_DELTA, token.accessToken);
      }
    }
  });

  volumeSlider.onmousemove = async function (e) {
    const inputVal = parseInt((e.target as HTMLInputElement).value);
    if (inputVal !== device.volumePercent) {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        displayVolumeControl(inputVal, false);
        await setVolume(inputVal, token.accessToken);
      }, 30);
    }
  };

  volumeIcon.onclick = async function () {
    savedVolume = parseInt(volumeSlider.value);
    displayVolumeControl(0, true);
    await setVolume(0, token.accessToken);
  };

  volumeIcon.onmouseenter = async function () {
    volumeSlider.classList.add('mini-spotify-left-panel-volume-expand');
    volumeSlider.classList.remove('mini-spotify-left-panel-volume-hidden');
  };

  volumeMutedIcon.onclick = async function () {
    displayVolumeControl(savedVolume, true);
    await setVolume(savedVolume, token.accessToken);
  };

  volumeMutedIcon.onmouseenter = async function () {
    volumeSlider.classList.add('mini-spotify-left-panel-volume-expand');
    volumeSlider.classList.remove('mini-spotify-left-panel-volume-hidden');
  };

  volumeContainer.onmouseleave = async function () {
    volumeSlider.classList.remove('mini-spotify-left-panel-volume-expand');
    setTimeout(() => {
      volumeSlider.classList.add('mini-spotify-left-panel-volume-hidden');
    }, 350);
  };

  document.addEventListener('keydown', async (e) => {
    e.preventDefault();
    if (e.code === 'Space') {
      if (playback.isPlaying === true) {
        await pause();
      } else {
        await play();
      }
    }
  });

  btnPause.onclick = async function (e) {
    e.preventDefault();
    await pause();
  };

  btnPlay.onclick = async function (e) {
    e.preventDefault();
    await play();
  };

  btnPrev.onclick = async function (e) {
    e.preventDefault();
    await prevTrack(device.id, token.accessToken);
    // after click next song, call API again to update UI
    setTimeout(async () => {
      await render();
    }, TIME_OUT);
  };

  btnNext.onclick = async function (e) {
    e.preventDefault();
    await nextTrack(device.id, token.accessToken);
    // after click next song, call API again to update UI
    setTimeout(async () => {
      await render();
    }, TIME_OUT);
  };

  btnSave.onclick = async function (e) {
    e.preventDefault();
    if (!playback.isSave) {
      // add track to saved list
      await saveTrack(playback, token.accessToken);
      await render();
    }
  };

  btnUnSave.onclick = async function (e) {
    e.preventDefault();
    if (playback.isSave) {
      // remove track from saved list
      await removeTrack(playback, token.accessToken);
      await render();
    }
  };

  btnRepeat.onclick = async function (e) {
    let mode: RepeatMode = 'off';

    switch (playback.repeatState) {
      case 'off':
        mode = 'context';
        break;
      case 'context':
        mode = 'track';
        break;
      default:
        break;
    }

    await repeat(mode, token.accessToken);
    await render();
  };

  async function pause() {
    displayControlButtons('play');
    await pauseTrack(device.id, token.accessToken);
    updateTrackInfo(playback, 'isPlaying', false);
    updateTrackCache({ isPlaying: false });
  }

  async function play() {
    displayControlButtons('pause');
    await playTrack(playback, device.id, token.accessToken);
    updateTrackInfo(playback, 'isPlaying', true);
    updateTrackCache({ isPlaying: true });
  }
}

type ButtonType = 'play' | 'pause';
type BoxType = 'player' | 'no-device-open-notification' | 'login-notification';
