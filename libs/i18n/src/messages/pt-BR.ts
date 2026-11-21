import type { Messages } from './index';

export const ptBR: Messages = {
  app: {
    name: 'CQ talk',
  },
  rig: {
    model: 'SSB TRANSCEIVER · MODEL 69',
    soundOn: 'SOM · ON',
    soundOff: 'SOM · OFF',
    onAir: 'ON AIR',
    meter: 'Medidor de sinal',
    meterUnits: 'S UNITS',
    mhz: 'MHz',
    worldBand: 'BANDA MUNDIAL · 3–30',
  },
  mic: {
    on: 'MIC ON',
    off: 'MIC OFF',
    closing: 'MIC OFF · 73',
    hintOn: 'Toque no microfone para desligá-lo e encerrar',
    hintOff: 'Liga quando você chama',
    hintClosing: 'Imprimindo seu cartão QSL…',
    labelOn: 'Desligar o microfone e encerrar a conversa',
    labelOff: 'Microfone desligado',
  },
  tuner: {
    prompt: 'Sobre o que você quer falar?',
    call: 'CHAMAR · CQ',
    weekly: 'FREQUÊNCIAS DA SEMANA',
    mhz: '{freq} MHz',
  },
  presets: {
    health: 'Saúde e ciência',
    worldCup: 'Copa do Mundo 2026',
    ai: 'Inteligência artificial',
    climate: 'Mudanças climáticas',
    space: 'Exploração espacial',
    economy: 'Economia global',
    elections: 'Eleições',
    movies: 'Cinema e séries',
  },
  stations: {
    tokyo: 'Tóquio, Japão',
    london: 'Londres, Reino Unido',
    sydney: 'Sydney, Austrália',
    newYork: 'Nova York, EUA',
    toronto: 'Toronto, Canadá',
    helsinki: 'Helsinque, Finlândia',
  },
  report: {
    newQso: 'NOVO QSO',
  },
  footer: {
    free: 'Grátis · sua API key fica só neste navegador',
    settings: 'Configurar key',
    logbook: 'Meus QSL',
    language: 'Idioma',
  },
};
