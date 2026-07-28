"use client";

import { useSyncUser } from "@/hooks/syncUsertoDb";

const SyncUser = () => {
  useSyncUser();

  return null;
};

export default SyncUser;
