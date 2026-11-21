import type { Messages } from './index';

export const en: Messages = {
  app: {
    name: 'CQ talk',
  },
  rig: {
    model: 'SSB TRANSCEIVER · MODEL 69',
    soundOn: 'SOUND · ON',
    soundOff: 'SOUND · OFF',
    onAir: 'ON AIR',
    meter: 'Signal meter',
    meterUnits: 'S UNITS',
    mhz: 'MHz',
    worldBand: 'WORLD BAND · 3–30',
  },
  mic: {
    on: 'MIC ON',
    off: 'MIC OFF',
    closing: 'MIC OFF · 73',
    hintOn: 'Tap the microphone to switch it off and finish',
    hintOff: 'It turns on when you call',
    hintClosing: 'Printing your QSL card…',
    labelOn: 'Switch off the microphone and end the conversation',
    labelOff: 'Microphone off',
  },
  footer: {
    free: 'Free · your API key stays in this browser',
    settings: 'Set up key',
    logbook: 'My QSLs',
    language: 'Language',
  },
};
