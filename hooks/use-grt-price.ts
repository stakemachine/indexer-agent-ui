"use client";
import useSWR from "swr";
import { fetchGRTPrice } from "@/lib/utils";

const GRT_PRICE_KEY = "grt-price";

export function useGRTPrice() {
  const { data, error, isLoading, mutate } = useSWR(GRT_PRICE_KEY, fetchGRTPrice, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // Dedupe requests within 10 seconds
  });

  return {
    price: data,
    error,
    isLoading,
    refresh: mutate,
  };
}
