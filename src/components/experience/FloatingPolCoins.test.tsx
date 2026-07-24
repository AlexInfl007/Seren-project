import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FloatingPolCoins from "@/components/experience/FloatingPolCoins";

describe("FloatingPolCoins", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses one passive scroll listener and cleans animation resources", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(17);
    const cancelAnimationFrame = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const { unmount, container } = render(<FloatingPolCoins />);
    expect(container.querySelectorAll(".pol-coin")).toHaveLength(12);
    expect(add).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
  });

  it("does not start an animation loop when reduced motion is requested", () => {
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: true })) });
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame");
    const { container } = render(<FloatingPolCoins />);
    expect(container.querySelector(".floating-pol-coins")).toHaveAttribute("data-motion", "reduced");
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
