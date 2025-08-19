"use client";
import Image from "next/image";
import { motion } from "framer-motion";

type Props = {
  name?: string;
  imageUrl?: string | null;
};

export function ProfileBadge({ name = "Jordan", imageUrl }: Props) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="relative inline-flex items-center gap-2">
      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20 glass">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-white/80">
            {initials}
          </div>
        )}
        <motion.span
          className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </div>
      <span className="text-white/80 text-sm">{name}</span>
    </div>
  );
}

