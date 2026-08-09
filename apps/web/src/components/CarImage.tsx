"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import CarIllustration from "@/components/CarIllustration";

interface CarImageProps {
  src: string | undefined;
  sources?: string[];
  alt: string;
  make: string;
  model: string;
  bodyType?: string;
  className?: string;
}

export default function CarImage({ src, sources = [], alt, make, model, bodyType, className = "" }: CarImageProps) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const all = useMemo(() => {
    const list: string[] = [];
    if (src) list.push(src);
    for (const s of sources) {
      if (s && !list.includes(s)) list.push(s);
    }
    return list;
  }, [src, sources]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    setImgError(false);
    setImgSrc(src);
  }, [src, sources]);

  const handleError = useCallback(() => {
    if (index < all.length - 1) {
      setIndex(index + 1);
      setImgSrc(all[index + 1]);
    } else {
      setImgError(true);
    }
  }, [index, all]);

  if (imgError || !imgSrc) {
    return <CarIllustration make={make} model={model} bodyType={bodyType} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={imgSrc}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
