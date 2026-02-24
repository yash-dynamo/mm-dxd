"use client";

import { useState } from "react";
import Image from "next/image";
import { AsciiArt } from "@/components/ui/ascii-art";

type AsciiImageProps = {
  /** Image source path */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of the container (number for px, string for any CSS value) */
  width?: number | string;
  /** Height of the container (number for px, string for any CSS value) */
  height?: number | string;
  /** Aspect ratio (e.g., "3/4", "16/9", "1/1") - used if width/height not both specified */
  aspectRatio?: string;
  /** ASCII art color */
  color?: string;
  /** ASCII resolution (higher = more detail) */
  resolution?: number;
  /** Show real image on hover */
  showImageOnHover?: boolean;
  /** Initial image opacity (0-1) */
  imageOpacity?: number;
  /** Image opacity on hover (0-1) */
  imageHoverOpacity?: number;
  /** Enable edge detection for better shape definition */
  edgeDetection?: boolean;
  /** Contrast adjustment (1.0 = normal) */
  contrast?: number;
  /** Boost skin-tone regions */
  skinToneBoost?: boolean;
  /** Object fit for the image */
  objectFit?: "cover" | "contain" | "fill";
  /** Object position for the image */
  objectPosition?: string;
  /** Additional className for the container */
  className?: string;
  /** Additional inline styles for the container */
  style?: React.CSSProperties;
  /** Charset for ASCII rendering */
  charset?: string;
  /** Children to render on top (e.g., overlays, text) */
  children?: React.ReactNode;
  /** External hover state (if controlled by parent) */
  isHovered?: boolean;
};

export default function AsciiImage({
  src,
  alt,
  width,
  height,
  aspectRatio = "1/1",
  color = "#cc0000",
  resolution = 120,
  showImageOnHover = true,
  imageOpacity = 0,
  imageHoverOpacity = 0.4,
  edgeDetection = false,
  contrast = 1.8,
  skinToneBoost = true,
  objectFit = "cover",
  objectPosition = "center center",
  className = "",
  style = {},
  charset = "dense",
  children,
  isHovered: externalHovered,
}: AsciiImageProps) {
  const [internalHovered, setInternalHovered] = useState(false);
  
  // Use external hover state if provided, otherwise use internal
  const hovered = externalHovered !== undefined ? externalHovered : internalHovered;
  const isControlled = externalHovered !== undefined;

  // Calculate visual aspect for ASCII component
  const getVisualAspect = (): number => {
    if (aspectRatio) {
      const [w, h] = aspectRatio.split("/").map(Number);
      if (w && h) return w / h;
    }
    if (typeof width === "number" && typeof height === "number") {
      return width / height;
    }
    return 1;
  };

  // Always use aspectRatio for proper sizing
  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    aspectRatio,
    ...(width !== undefined && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height !== undefined && { height: typeof height === "number" ? `${height}px` : height }),
    ...style,
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onMouseEnter={isControlled ? undefined : () => setInternalHovered(true)}
      onMouseLeave={isControlled ? undefined : () => setInternalHovered(false)}
    >
      {/* Real Image Layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: showImageOnHover ? (hovered ? imageHoverOpacity : imageOpacity) : 0,
          transition: "opacity 0.6s ease-out",
          zIndex: 0,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          style={{
            objectFit,
            objectPosition,
            filter: "brightness(0.7) saturate(0.5)",
          }}
        />
      </div>

      {/* ASCII Art Layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          mixBlendMode: showImageOnHover && imageOpacity > 0 ? "screen" : "normal",
          zIndex: 1,
        }}
      >
        <AsciiArt
          src={src}
          resolution={resolution}
          charset={charset}
          color={color}
          animationStyle="fade"
          inverted
          animateOnView={false}
          objectFit={objectFit}
          visualAspect={getVisualAspect()}
          edgeDetection={edgeDetection}
          contrast={contrast}
          skinToneBoost={skinToneBoost}
          className="w-full h-full bg-transparent"
        />
      </div>

      {/* Children (overlays, text, etc.) */}
      {children && (
        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
          {children}
        </div>
      )}
    </div>
  );
}
