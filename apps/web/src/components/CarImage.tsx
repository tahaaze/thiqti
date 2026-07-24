"use client";

import { useState, useCallback } from "react";
import { CarFront } from "lucide-react";

const BRAND_COLORS: Record<string, string> = {
  Dacia: "#00614E",
  Renault: "#FFCC33",
  Peugeot: "#1F3C73",
  Toyota: "#EB0A1E",
  Hyundai: "#002C5F",
  Kia: "#05141F",
  Volkswagen: "#001E50",
  BMW: "#1C69D4",
  Mercedes: "#333333",
  BYD: "#1A1A1A",
  MG: "#C8102E",
  Ford: "#003478",
  Nissan: "#C3002F",
  Fiat: "#8B1F40",
  Citroën: "#6B6E72",
  Opel: "#FFD700",
  Jeep: "#4A6741",
  "Škoda": "#4BA82E",
  Seat: "#E81F2B",
  Suzuki: "#003B73",
  Volvo: "#003057",
  DFSK: "#C41230",
  Mazda: "#910A2E",
};

function getInitials(make: string, model: string): string {
  return `${make.charAt(0)}${model.charAt(0)}`.toUpperCase();
}

function getBrandColor(make: string): string {
  return BRAND_COLORS[make] || "#1a1a2e";
}

interface CarImageProps {
  src: string | undefined;
  alt: string;
  make: string;
  model: string;
  className?: string;
}

export default function CarImage({ src, alt, make, model, className = "" }: CarImageProps) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = useCallback(() => {
    if (!imgError) {
      setImgError(true);
    }
  }, [imgError]);

  if (imgError || !imgSrc) {
    const color = getBrandColor(make);
    const initials = getInitials(make, model);

    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{
          background: `linear-gradient(135deg, ${color}ee 0%, ${color}aa 50%, ${color}66 100%)`,
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <CarFront className="w-12 h-12 text-white/30 mb-2" />
          <span className="text-white/80 text-lg font-bold tracking-wider">
            {initials}
          </span>
          <span className="text-white/50 text-xs mt-1">
            {make} {model}
          </span>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
