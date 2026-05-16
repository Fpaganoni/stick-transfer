"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface AvatarUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface AvatarWithStoryProps {
  user: AvatarUser;
  imgClassName?: string;
}

export function AvatarWithStory({
  user,
  imgClassName = "w-10 h-10 object-cover",
}: AvatarWithStoryProps) {
  const locale = useLocale();
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${locale}/profile/${user.username.replace(/\./g, "/")}`);
  };

  return (
    <div onClick={handleClick} className="rounded-full cursor-pointer shrink-0">
      <div className="rounded-full overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          src={user.avatar || "/user.png"}
          alt={user.name}
          className={imgClassName}
        />
      </div>
    </div>
  );
}
