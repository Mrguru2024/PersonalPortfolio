"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { DiagnosisScores } from "./scoring";

const STORAGE_KEY = "growth_funnel_state";

export interface FunnelState {
  answers: Record<string, string>;
  scores: DiagnosisScores | null;
  completedAt: string | null;
}

const defaultState: FunnelState = {
  answers: {},
  scores: null,
  completedAt: null,
};

function loadState(): FunnelState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as FunnelState;
    return {
      answers: parsed.answers ?? {},
      scores: parsed.scores ?? null,
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return defaultState;
  }
}

function saveState(state: FunnelState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface FunnelContextValue extends FunnelState {
  setAnswer: (questionId: string, value: string) => void;
  setScores: (scores: DiagnosisScores) => void;
  clearFunnel: () => void;
  hydrate: () => void;
}

const FunnelContext = createContext<FunnelContextValue | null>(null);

export function FunnelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FunnelState>(defaultState);
  const [mounted, setMounted] = useState(false);

  const hydrate = useCallback(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setState(loadState());
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted && state.answers) {
      saveState(state);
    }
  }, [mounted, state]);

  const setAnswer = useCallback((questionId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);

  const setScores = useCallback((scores: DiagnosisScores) => {
    setState((prev) => ({
      ...prev,
      scores,
      completedAt: new Date().toISOString(),
    }));
  }, []);

  const clearFunnel = useCallback(() => {
    setState(defaultState);
    saveState(defaultState);
  }, []);

  const value = useMemo<FunnelContextValue>(
    () => ({
      ...state,
      setAnswer,
      setScores,
      clearFunnel,
      hydrate,
    }),
    [state, setAnswer, setScores, clearFunnel, hydrate]
  );

  return <FunnelContext.Provider value={value}>{children}</FunnelContext.Provider>;
}

export function useFunnel() {
  const ctx = useContext(FunnelContext);
  if (!ctx) throw new Error("useFunnel must be used within FunnelProvider");
  return ctx;
}
