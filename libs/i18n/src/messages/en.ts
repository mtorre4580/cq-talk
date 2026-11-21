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
  tuner: {
    prompt: 'What do you want to talk about?',
    call: 'CALL · CQ',
    weekly: "THIS WEEK'S FREQUENCIES",
    mhz: '{freq} MHz',
  },
  presets: {
    health: 'Health and science',
    worldCup: 'World Cup 2026',
    ai: 'Artificial intelligence',
    climate: 'Climate change',
    space: 'Space exploration',
    economy: 'Global economy',
    elections: 'Elections',
    movies: 'Movies and series',
  },
  stations: {
    tokyo: 'Tokyo, Japan',
    london: 'London, United Kingdom',
    sydney: 'Sydney, Australia',
    newYork: 'New York, USA',
    toronto: 'Toronto, Canada',
    helsinki: 'Helsinki, Finland',
  },
  report: {
    newQso: 'NEW QSO',
  },
  footer: {
    free: 'Free · your API key stays in this browser',
    settings: 'Set up key',
    logbook: 'My QSLs',
    language: 'Language',
  },
};
