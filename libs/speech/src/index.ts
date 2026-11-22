export { createSpeechInput, findRecognition } from './speechInput';
export type {
  RecognitionConstructor,
  SpeechInput,
  SpeechInputError,
  SpeechInputOptions,
  SpeechRecognitionLike,
} from './speechInput';
export { createSpeechOutput, pickVoice } from './speechOutput';
export type { SpeechOutput } from './speechOutput';
export { endsTransmission, normalizeTransmission } from './transmission';
export { createCloudSpeechOutput } from './cloudSpeechOutput';
export type { CloudSpeechOptions, Playback } from './cloudSpeechOutput';
export {
  createElevenLabsClient,
  ELEVENLABS_API,
  ELEVENLABS_MODEL,
  ElevenLabsError,
  operatorVoiceScore,
  rankOperatorVoices,
} from './elevenLabs';
export type { ElevenLabsCheck, ElevenLabsClient, ElevenLabsVoice } from './elevenLabs';
