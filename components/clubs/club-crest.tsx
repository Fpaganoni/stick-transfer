"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ClubCrestProps {
  name: string;
  logo?: string | null;
  /** Pixel size to request the image at; the box itself is sized by `className`. */
  size: number;
  /** Letters shown when there is no crest. Defaults to the first letter of the name. */
  initials?: string;
  className?: string;
}

/**
 * A club crest is a logo, not a photo: it is drawn whole (object-contain) on a
 * neutral background and never cropped to a circle. Without one, the club
 * initial takes its place.
 */
export function ClubCrest({ name, logo, size, initials, className }: ClubCrestProps) {
  const letters = initials ?? (Array.from(name.trim())[0]?.toUpperCase() || "?");

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-md border border-border flex items-center justify-center",
        logo ? "bg-background" : "bg-primary/10",
        className,
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={size}
          height={size}
          className="size-full object-contain p-1"
        />
      ) : (
        <span role="img" aria-label={name} className="text-primary font-bold select-none">
          {letters}
        </span>
      )}
    </div>
  );
}
