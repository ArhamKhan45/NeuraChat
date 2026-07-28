import Image from "next/image";
import Link from "next/link";

import { ModeToggle } from "../theme-toggle";

const Header = () => {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <Link
        href="/"
        aria-label="Go to NeuroChat home"
        className="flex h-12 min-w-0 flex-1 items-center overflow-hidden group-data-[collapsible=icon]:hidden "
      >
        <Image
          src="/images/light.png"
          alt="NeuroChat logo"
          width={140}
          height={40}
          priority
          className="h-full w-auto object-contain object-left dark:hidden cursor-pointer"
        />

        <Image
          src="/images/dark.png"
          alt="NeuroChat logo"
          width={140}
          height={40}
          priority
          className="hidden h-full w-auto object-contain object-left dark:block cursor-pointer"
        />
      </Link>

      <ModeToggle />
    </header>
  );
};

export default Header;
