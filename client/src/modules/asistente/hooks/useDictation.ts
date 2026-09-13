'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

/**
 * Mensajes por código de la API. `network` es el caso típico en Chromium sin
 * servicios de Google (Brave, Helium, ungoogled): el motor existe pero no hay
 * a dónde mandar el audio, y sin este aviso el botón parece simplemente roto.
 */
const DICTATION_ERRORS: Record<string, string> = {
  'not-allowed': 'Permite el micrófono en el navegador para dictar.',
  'service-not-allowed': 'Este navegador bloquea el servicio de dictado.',
  network:
    'El dictado necesita el servicio de voz de Chrome; este navegador no lo incluye.',
  'audio-capture': 'No se encontró un micrófono.',
  'no-speech': 'No se escuchó nada. Intenta de nuevo.',
  aborted: '',
};

function recognitionCtor() {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noSubscribe = () => () => {};

/**
 * Dictado con la API del navegador. Donde no existe (Firefox, algunos
 * móviles) `supported` es false y el compositor no muestra el botón, en vez
 * de ofrecer algo que no funciona.
 *
 * El reconocedor se crea en el primer clic, no al montar: así no hay estado
 * que sincronizar desde un efecto ni renders en cascada.
 */
export function useDictation(onText: (text: string) => void) {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => Boolean(recognitionCtor()),
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const instance = useRef<SpeechRecognitionLike | null>(null);
  const handler = useRef(onText);

  useEffect(() => {
    handler.current = onText;
  }, [onText]);

  useEffect(
    () => () => {
      instance.current?.stop();
      instance.current = null;
    },
    [],
  );

  const toggle = useCallback(() => {
    if (listening) {
      instance.current?.stop();
      return;
    }
    if (!instance.current) {
      const Recognition = recognitionCtor();
      if (!Recognition) return;
      const created = new Recognition();
      created.lang = 'es-MX';
      created.continuous = false;
      created.interimResults = false;
      created.onstart = () => {
        setListening(true);
        setError('');
      };
      created.onend = () => setListening(false);
      created.onerror = (event) => {
        setListening(false);
        setError(
          DICTATION_ERRORS[event.error ?? ''] ??
            'No se pudo iniciar el dictado en este navegador.',
        );
      };
      created.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) handler.current(transcript);
      };
      instance.current = created;
    }
    instance.current.start();
  }, [listening]);

  return { supported, listening, error, toggle };
}
