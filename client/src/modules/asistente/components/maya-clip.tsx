import { MayaMark } from './maya-mark';

/**
 * Animación decorativa de Maya. Se reproduce sin sonido y sin controles.
 *
 * El WebM va primero porque es el único de los dos que conserva transparencia;
 * el MP4 queda como respaldo para navegadores sin VP9 con alpha (Safari), donde
 * Maya aparece sobre su placa clara en vez de recortada. Con
 * `prefers-reduced-motion` el CSS sustituye todo por la marca estática.
 */
export function MayaClip({
  name,
  loop = false,
  className = '',
}: {
  name: 'maya-entrada' | 'maya-pensando' | 'maya-lista' | 'maya-idle';
  loop?: boolean;
  className?: string;
}) {
  return (
    <span className={`maya-clip ${className}`} aria-hidden="true">
      <video
        className="maya-clip-video"
        poster={`/videos/${name}-poster.png`}
        autoPlay
        muted
        loop={loop}
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        <source src={`/videos/${name}.webm`} type="video/webm" />
        <source src={`/videos/${name}.mp4`} type="video/mp4" />
      </video>
      <MayaMark className="maya-clip-still" />
    </span>
  );
}
