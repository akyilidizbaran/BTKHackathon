import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  FloatingResultPanel,
  type FloatingApplyState,
} from "@/components/commerce/floating-agent-result-panel";
import { getDefaultBuyerAgentApiData } from "@/lib/api/buyer-agent";
import { getDefaultSellerAgentApiData } from "@/lib/api/seller-agent";
import type { BuyerAgentApplyStrategy } from "@/lib/api/buyer-agent";

describe("Floating Agent result panel", () => {
  it("renders buyer recommendations and calls append/replace handlers", async () => {
    const user = userEvent.setup();
    const buyerData = getDefaultBuyerAgentApiData();
    const onApplyBuyer = vi.fn<(strategy: BuyerAgentApplyStrategy) => void>();

    render(
      <FloatingResultPanel
        applyState={{ status: "idle" }}
        buyerData={buyerData}
        onApplyBuyer={onApplyBuyer}
        onApplySeller={vi.fn()}
        onRollbackSeller={vi.fn()}
        role="buyer"
        sellerData={null}
      />,
    );

    expect(screen.getByText(buyerData.summary.intentLabel)).toBeTruthy();
    expect(screen.getByText(buyerData.message.confirmationQuestion)).toBeTruthy();
    expect(screen.getByText(buyerData.recommendations[0].product.name)).toBeTruthy();
    expect(screen.getByText(buyerData.recommendations[1].product.name)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Sepete ekle" }));
    await user.click(screen.getByRole("button", { name: "Sepeti değiştir" }));

    expect(onApplyBuyer).toHaveBeenNthCalledWith(1, "append");
    expect(onApplyBuyer).toHaveBeenNthCalledWith(2, "replace");
  });

  it("disables buyer apply buttons while mutation is loading", () => {
    const buyerData = getDefaultBuyerAgentApiData();

    render(
      <FloatingResultPanel
        applyState={{ status: "loading" }}
        buyerData={buyerData}
        onApplyBuyer={vi.fn()}
        onApplySeller={vi.fn()}
        onRollbackSeller={vi.fn()}
        role="buyer"
        sellerData={null}
      />,
    );

    expect((screen.getByRole("button", { name: "Sepete ekle" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Sepeti değiştir" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Onaylı işlem hazırlanıyor.")).toBeTruthy();
  });

  it("renders seller draft preview and controls rollback availability from audit id", async () => {
    const user = userEvent.setup();
    const sellerData = getDefaultSellerAgentApiData();
    const onApplySeller = vi.fn<() => void>();
    const onRollbackSeller = vi.fn<() => void>();
    const appliedState: FloatingApplyState = {
      auditId: "audit-1",
      message: "Listing taslağı uygulandı.",
      status: "applied",
    };

    render(
      <FloatingResultPanel
        applyState={appliedState}
        buyerData={null}
        onApplyBuyer={vi.fn()}
        onApplySeller={onApplySeller}
        onRollbackSeller={onRollbackSeller}
        role="seller"
        sellerData={sellerData}
      />,
    );

    if (!sellerData.draftPreview) {
      throw new Error("Seller Agent fixture must include draft preview.");
    }

    expect(screen.getByText(sellerData.message.headline)).toBeTruthy();
    expect(screen.getByText(sellerData.draftPreview.productName)).toBeTruthy();
    expect(screen.getByText(appliedState.message)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Taslağı uygula" }));
    await user.click(screen.getByRole("button", { name: "Geri al" }));

    expect(onApplySeller).toHaveBeenCalledTimes(1);
    expect(onRollbackSeller).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when role data is absent", () => {
    const { container } = render(
      <FloatingResultPanel
        applyState={{ status: "idle" }}
        buyerData={null}
        onApplyBuyer={vi.fn()}
        onApplySeller={vi.fn()}
        onRollbackSeller={vi.fn()}
        role="buyer"
        sellerData={null}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
