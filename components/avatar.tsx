"use client";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-24 w-24 text-2xl",
};

export function Avatar({
  imageUrl,
  initials,
  size = "md",
  className = "",
}: {
  imageUrl: string | null;
  initials: string;
  size?: AvatarSize;
  className?: string;
}) {
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 overflow-hidden ${sizeClass} ${className}`}
      role="img"
      aria-label={initials ? `Avatar for ${initials}` : "User avatar"}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-medium uppercase">{initials}</span>
      )}
    </div>
  );
}

export function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string | undefined
): string {
  if (firstName?.trim() && lastName?.trim()) {
    return `${firstName.trim()[0]}${lastName.trim()[0]}`.toUpperCase();
  }
  if (firstName?.trim()) {
    return firstName.trim().slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0];
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return local[0]?.toUpperCase() ?? "?";
  }
  return "?";
}
