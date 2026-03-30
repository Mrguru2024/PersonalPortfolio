/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReadAloudButton } from "./ReadAloudButton";

describe("ReadAloudButton", () => {
  const originalSpeech = window.speechSynthesis;
  const OriginalUtterance = globalThis.SpeechSynthesisUtterance;
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ openaiTts: false, geminiTts: false }),
    }) as unknown as typeof fetch;

    globalThis.SpeechSynthesisUtterance = jest.fn().mockImplementation(() => ({
      rate: 1,
      pitch: 1,
      onend: null as (() => void) | null,
      onerror: null as (() => void) | null,
    })) as unknown as typeof SpeechSynthesisUtterance;

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      writable: true,
      value: {
        cancel: jest.fn(),
        speak: jest.fn(),
        getVoices: jest.fn(() => []),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    globalThis.SpeechSynthesisUtterance = OriginalUtterance;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      writable: true,
      value: originalSpeech,
    });
    jest.restoreAllMocks();
  });

  it("renders listen label", async () => {
    render(<ReadAloudButton text="Hello world" />);
    expect(await screen.findByRole("button", { name: /listen/i })).toBeInTheDocument();
  });

  it("starts speech when clicked", async () => {
    render(<ReadAloudButton text="Hello world" label="Play" />);
    const btn = await screen.findByRole("button", { name: /play/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    });
  });
});
