import "@testing-library/jest-dom";
import { vi } from "vitest";

// Global mock for geist mono font (next/font not fully supported in Vitest env)
vi.mock("geist/font/mono", () => ({ GeistMono: { className: "geist-mono" } }));
