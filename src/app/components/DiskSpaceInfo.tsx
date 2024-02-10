"use client";

import { MAX_AVAILABLE_STORAGE_PERCENTAGE } from "@/constants";
import { bytesToSize, isPositiveNumber } from "@/utils/utils";
import React, { useState, useEffect } from "react";

const DiskSpaceInfo = ({ usage }: { usage: number }) => {
  const [quota, setQuota] = useState<number | null | undefined>(null);

  useEffect(() => {
    const getStorageInfo = async () => {
      try {
        const { quota } = await navigator.storage.estimate();
        setQuota(quota);
      } catch (error) {
        console.error("Error getting storage info:", error);
      }
    };

    getStorageInfo();
  }, []);

  return (
    <div className="text-white">
      {isPositiveNumber(quota) && (
        <p>
          {bytesToSize(Number(usage))} of
          {bytesToSize(Number(quota))}
        </p>
      )}
    </div>
  );
};

export default DiskSpaceInfo;
