"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface YoutubeWidgetProps {
  url: string;
  title?: string;
}

export function YoutubeWidget({ url, title = "YouTube Video" }: YoutubeWidgetProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID safely
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;

  if (!videoId) {
    return (
      <div className="w-full aspect-video rounded-xl border border-border bg-muted flex items-center justify-center text-foreground-muted text-sm">
        Invalid YouTube URL
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <motion.div
      whileHover={!isPlaying ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative w-full aspect-video rounded-xl border border-border overflow-hidden bg-black shadow-md group"
    >
      {!isPlaying ? (
        <button
          onClick={() => setIsPlaying(true)}
          className="w-full h-full relative cursor-pointer"
          aria-label={`Play ${title}`}
        >
          {/* Thumbnail */}
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center text-primary-foreground shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300"
            >
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            </motion.div>
          </div>
        </button>
      ) : (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      )}
    </motion.div>
  );
}
