import emmanuel from "@/assets/avatar-emmanuel.jpg";
import laura from "@/assets/avatar-laura.jpg";
import vanessa from "@/assets/avatar-juan-daniel.jpg";
import juanManuel from "@/assets/avatar-juan-manuel.jpg";
import type { UserId } from "@/lib/skillswap/types";
import { cn } from "@/lib/utils";

export const AVATARS: Record<UserId, string> = { emmanuel, laura, vanessa, "juan-manuel": juanManuel };

const SIZES = {
  xs: "size-7",
  sm: "size-9",
  md: "size-12",
  lg: "size-20",
  xl: "size-32",
};

export function UserAvatar({
  userId,
  name,
  size = "sm",
  className,
  src,
}: {
  userId: UserId;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  src?: string | undefined;
}) {
  const picture = src || AVATARS[userId];
  if (!picture) return <span role="img" aria-label={`Avatar de ${name}`} className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand", SIZES[size], className)}>{name.charAt(0).toUpperCase()}</span>;
  return (
    <img
      src={picture}
      alt={`Foto de ${name}`}
      width={816}
      height={816}
      loading="lazy"
      className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)}
    />
  );
}
