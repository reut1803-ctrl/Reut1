"use client";

import { useEffect, useState } from "react";
import { loadData, getCurrentUser } from "./store";

export function useData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(loadData());
    const handler = () => setData(loadData());
    window.addEventListener("shidduch_update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("shidduch_update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return data;
}

export function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const handler = () => setUser(getCurrentUser());
    window.addEventListener("shidduch_update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("shidduch_update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return user;
}
