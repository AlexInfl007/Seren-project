import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FaqSection from "@/components/marketing/FaqSection";
import HeroSection from "@/components/marketing/HeroSection";
import Header from "@/components/layout/Header";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { CONTRACT_ADDRESS, CONTRACT_LINK } from "@/config/contract";
import { localeDirection, locales } from "@/i18n/locales";
import { siteContent } from "@/i18n/siteContent";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: () => <span data-testid="next-image" />,
  getImageProps: ({ src, alt, sizes }: { src: string; alt: string; sizes: string }) => ({
    props: { src, srcSet: `${src} 1x`, sizes, alt },
  }),
}));

afterEach(() => {
  document.body.className = "";
});

describe("localized marketing content", () => {
  it("defines complete content and at least 13 FAQ entries for every locale", () => {
    for (const locale of locales) {
      const content = siteContent[locale];
      expect(content.hero.title.length).toBeGreaterThan(12);
      expect(content.hero.description.length).toBeGreaterThan(40);
      expect(content.how.steps).toHaveLength(4);
      expect(content.trust).toHaveLength(6);
      expect(content.faq.items.length).toBeGreaterThanOrEqual(13);
      expect(content.faq.items.every((item) => item.question.trim() && item.answer.trim())).toBe(true);
    }
  });

  it("marks Arabic as RTL and every other locale as LTR", () => {
    expect(localeDirection("ar")).toBe("rtl");
    for (const locale of locales.filter((item) => item !== "ar")) expect(localeDirection(locale)).toBe("ltr");
  });

  it("renders one visible H1, a working primary CTA and the final contract address", () => {
    const { container } = render(<HeroSection locale="en" content={siteContent.en} />);
    const headings = container.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    expect(headings[0]).not.toHaveClass("sr-only");
    expect(headings[0]).toHaveTextContent("Seren Lottery Chain");
    expect(container.querySelector(".hero-slogan")).toHaveTextContent(siteContent.en.hero.title);
    expect(container.querySelector("source[media='(max-width: 680px)']")).toHaveAttribute("srcset", expect.stringContaining("hero-seren-mobile.png"));
    expect(screen.getByRole("link", { name: siteContent.en.hero.primary })).toHaveAttribute("href", "/en#lottery");
    expect(screen.getByRole("link", { name: siteContent.en.hero.secondary })).toHaveAttribute("href", CONTRACT_LINK);
    expect(CONTRACT_LINK).toContain(CONTRACT_ADDRESS);
  });

  it("renders FAQ content in HTML without a wallet", () => {
    render(<FaqSection content={siteContent.ru} />);
    expect(screen.getAllByText(/Seren Lottery Chain/).length).toBeGreaterThan(0);
    expect(document.querySelectorAll("details")).toHaveLength(13);
  });
});

describe("header interactions", () => {
  it("opens and closes the mobile menu", () => {
    render(<WalletProvider><Header locale="en" content={siteContent.en} /></WalletProvider>);
    const button = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the wallet popover on Escape", () => {
    render(<WalletProvider><Header locale="en" content={siteContent.en} /></WalletProvider>);
    const walletButton = screen.getByRole("button", { name: /Connect wallet/i });
    fireEvent.click(walletButton);
    expect(walletButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(walletButton).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the wrong-network action for a mocked connected wallet and requests Polygon", async () => {
    const requests: string[] = [];
    const provider = {
      isMetaMask: true,
      request: vi.fn(async ({ method }: { method: string }) => {
        requests.push(method);
        if (method === "eth_requestAccounts" || method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
        if (method === "eth_chainId") return "0x1";
        if (method === "wallet_switchEthereumChain") return null;
        throw new Error(`Unexpected method ${method}`);
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
    };
    Object.defineProperty(window, "ethereum", { configurable: true, value: provider });
    render(<WalletProvider><Header locale="en" content={siteContent.en} /></WalletProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Connect wallet/i }));
    fireEvent.click(await screen.findByRole("button", { name: "MetaMask" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /0x1111/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Switch to Polygon/i }));
    await waitFor(() => expect(requests).toContain("wallet_switchEthereumChain"));
    Object.defineProperty(window, "ethereum", { configurable: true, value: undefined });
  });
});
