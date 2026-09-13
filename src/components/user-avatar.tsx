import Image from "next/image";

export const DEFAULT_AVATAR = "/avatars/default.svg";

type Props = {
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
  rounded?: "full" | "xl";
};

export function UserAvatar({
  name,
  image,
  size = 36,
  className = "",
  rounded = "xl",
}: Props) {
  const src = image?.trim() || DEFAULT_AVATAR;
  const alt = name?.trim() || "User";
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl";

  return (
    <div
      className={`avatar shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className={`${radius} overflow-hidden ring-1 ring-primary/20 shadow-[0_0_16px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]`}
        style={{ width: size, height: size }}
      >
        {/* data: URLs and local SVG — next/image needs unoptimized for data: */}
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
