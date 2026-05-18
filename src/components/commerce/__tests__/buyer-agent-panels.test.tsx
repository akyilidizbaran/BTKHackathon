import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  BuyerAgentApplyPanel,
  BuyerAgentConversationPanel,
  BuyerAgentFaq,
  BuyerRecommendationCard,
} from "@/components/commerce/buyer-agent-panels";
import { getDefaultBuyerAgentApiData } from "@/lib/api/buyer-agent";
import type { BuyerAgentApplyStrategy } from "@/lib/api/buyer-agent";

describe("Buyer Agent extracted panels", () => {
  it("renders the user prompt and assistant answer without technical trace copy", () => {
    const data = getDefaultBuyerAgentApiData();

    render(<BuyerAgentConversationPanel data={data} isLoading={false} />);

    expect(screen.getByText("Agent cevabı")).toBeTruthy();
    expect(screen.getByText(data.request.prompt)).toBeTruthy();
    expect(screen.getByText(data.message.content)).toBeTruthy();
    expect(screen.getByText(data.message.confirmationQuestion)).toBeTruthy();
    expect(screen.queryByText("Tool-calling trace")).toBeNull();
  });

  it("renders recommendation card product data and product detail link", () => {
    const data = getDefaultBuyerAgentApiData();
    const recommendation = data.recommendations[0];

    render(<BuyerRecommendationCard index={1} recommendation={recommendation} />);

    const productLink = screen.getAllByRole("link", { name: recommendation.product.name })[0];
    expect(productLink.getAttribute("href")).toBe(recommendation.product.href);
    expect(screen.getByText(recommendation.product.brand)).toBeTruthy();
    expect(screen.getByText(recommendation.primaryReason)).toBeTruthy();
    expect(screen.getByText(`Güven ${recommendation.item.confidenceScore}/100`)).toBeTruthy();
  });

  it("fires append and replace callbacks from the approval panel", async () => {
    const user = userEvent.setup();
    const data = getDefaultBuyerAgentApiData();
    const onApply = vi.fn<(strategy: BuyerAgentApplyStrategy) => void>();

    render(<BuyerAgentApplyPanel applyState={{ status: "idle" }} data={data} disabled={false} onApply={onApply} />);

    await user.click(screen.getByRole("button", { name: "Sepete Ekle" }));
    await user.click(screen.getByRole("button", { name: "Sepeti Değiştir" }));

    expect(onApply).toHaveBeenNthCalledWith(1, "append");
    expect(onApply).toHaveBeenNthCalledWith(2, "replace");
  });

  it("keeps approval buttons disabled while parent state blocks apply", () => {
    const data = getDefaultBuyerAgentApiData();
    const onApply = vi.fn<(strategy: BuyerAgentApplyStrategy) => void>();

    render(<BuyerAgentApplyPanel applyState={{ status: "idle" }} data={data} disabled={true} onApply={onApply} />);

    expect((screen.getByRole("button", { name: "Sepete Ekle" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Sepeti Değiştir" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("opens FAQ details without exposing smoke-test proof language as primary UI", async () => {
    const user = userEvent.setup();

    render(<BuyerAgentFaq />);

    const summary = screen.getByText("Neden bu ürünleri seçtiğini görebilir miyim?");
    const details = summary.closest("details");

    expect(details?.open).toBe(false);
    await user.click(summary);
    expect(details?.open).toBe(true);
    expect(screen.getByText(/Teknik trace ve smoke-test kanıtları kullanıcı ekranında tutulmaz/u)).toBeTruthy();
  });
});
