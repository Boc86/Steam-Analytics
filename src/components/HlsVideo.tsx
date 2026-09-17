import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsVideo({ src, poster, autoPlay = true, controls = true, className = "" }: { src: string, poster?: string, autoPlay?: boolean, controls?: boolean, className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          startLevel: -1, // Auto level
          capLevelToPlayerSize: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch(console.error);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native support
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          if (autoPlay) {
            video.play().catch(console.error);
          }
        });
      }
    } else {
      video.src = src;
      if (autoPlay) {
        video.play().catch(console.error);
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      poster={poster}
      crossOrigin="anonymous"
      playsInline
    />
  );
}
