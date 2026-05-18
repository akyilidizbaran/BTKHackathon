import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ListingMutationApprovalPanel,
  ListingSnapshot,
  type SellerAgentApplyState,
} from "@/components/commerce/seller-agent-listing-panels";
import { getDefaultSellerAgentApiData } from "@/lib/api/seller-agent";
import { sellerListingMutationUpdatedEvent } from "@/lib/agents/seller-listing-apply";
import type { SellerListingMutationAuditEntry } from "@/lib/agents/seller-listing-apply-client";

describe("Seller Agent listing panels", () => {
  it("renders before and after listing snapshots with stable commerce fields", () => {
    const { draftPreview } = getSellerDraftFixture();

    render(
      <div>
        <ListingSnapshot label="Önce" tone="light" values={draftPreview.beforeListing} />
        <ListingSnapshot label="Sonra" tone="dark" values={draftPreview.afterListing} />
      </div>,
    );

    expect(screen.getByText("Önce")).toBeTruthy();
    expect(screen.getByText("Sonra")).toBeTruthy();
    expect(screen.getByText(draftPreview.beforeListing.title)).toBeTruthy();
    expect(screen.getByText(draftPreview.afterListing.title)).toBeTruthy();
    expect(screen.getByText(draftPreview.afterListing.campaignLabel)).toBeTruthy();
  });

  it("shows draft approval, delta rows and empty audit state", async () => {
    const user = userEvent.setup();
    const { draftPreview } = getSellerDraftFixture();
    const onApply = vi.fn<() => void>();

    render(
      <ListingMutationApprovalPanel
        applyState={{ status: "idle" }}
        auditEntries={[]}
        draftPreview={draftPreview}
        onApply={onApply}
        onRollback={vi.fn()}
      />,
    );

    expect(screen.getByText(draftPreview.title)).toBeTruthy();
    expect(screen.getByText(draftPreview.approvalCopy)).toBeTruthy();
    expect(screen.getByText("Henüz uygulanmış listeleme değişikliği yok. İlk onay burada işlem kaydı oluşturacak.")).toBeTruthy();
    expect(screen.getByText(/Taslak satıcı onayı olmadan uygulanmaz/u)).toBeTruthy();

    draftPreview.delta.forEach((item) => {
      expect(screen.getByText(item.label)).toBeTruthy();
      expect(screen.getByText(item.after)).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "Taslağı uygula" }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("enables rollback only for applied audit entries and reports applied state", async () => {
    const user = userEvent.setup();
    const { draftPreview } = getSellerDraftFixture();
    const onRollback = vi.fn<(auditId: string) => void>();
    const auditEntry = createAuditEntry(draftPreview);
    const applyState: SellerAgentApplyState = {
      result: {
        auditId: auditEntry.id,
        eventName: sellerListingMutationUpdatedEvent,
        fieldCount: draftPreview.delta.length,
        message: "Listing taslağı uygulandı.",
        productId: draftPreview.productId,
        productName: draftPreview.productName,
        rollbackAvailable: true,
        status: "applied",
        surface: "route",
        toolId: draftPreview.toolId,
      },
      status: "applied",
    };

    render(
      <ListingMutationApprovalPanel
        applyState={applyState}
        auditEntries={[auditEntry]}
        draftPreview={draftPreview}
        onApply={vi.fn()}
        onRollback={onRollback}
      />,
    );

    expect(screen.getByText(/Listing taslağı uygulandı/u)).toBeTruthy();
    expect(screen.getAllByText(auditEntry.productName).length).toBeGreaterThan(0);
    expect(screen.getByText(/Son işlem:/u)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Geri al" }));
    expect(onRollback).toHaveBeenCalledWith(auditEntry.id);
  });

  it("renders rollback and error notices for non-happy paths", () => {
    const { draftPreview } = getSellerDraftFixture();

    const { rerender } = render(
      <ListingMutationApprovalPanel
        applyState={{
          result: {
            auditId: "audit-rollback",
            eventName: sellerListingMutationUpdatedEvent,
            message: "Listing değişikliği geri alındı.",
            ok: true,
            productId: draftPreview.productId,
            productName: draftPreview.productName,
            status: "rolled-back",
          },
          status: "rolled-back",
        }}
        auditEntries={[]}
        draftPreview={draftPreview}
        onApply={vi.fn()}
        onRollback={vi.fn()}
      />,
    );

    expect(screen.getByText("Listing değişikliği geri alındı.")).toBeTruthy();

    rerender(
      <ListingMutationApprovalPanel
        applyState={{
          message: "Listeleme değişikliği uygulanamadı.",
          status: "error",
        }}
        auditEntries={[]}
        draftPreview={draftPreview}
        onApply={vi.fn()}
        onRollback={vi.fn()}
      />,
    );

    expect(screen.getByText("Listeleme değişikliği uygulanamadı.")).toBeTruthy();
  });
});

function getSellerDraftFixture() {
  const data = getDefaultSellerAgentApiData();

  if (!data.draftPreview) {
    throw new Error("Seller Agent fixture must include draft preview.");
  }

  return {
    data,
    draftPreview: data.draftPreview,
  };
}

function createAuditEntry(
  draftPreview: ReturnType<typeof getSellerDraftFixture>["draftPreview"],
): SellerListingMutationAuditEntry {
  return {
    after: draftPreview.afterListing,
    before: draftPreview.beforeListing,
    createdAt: "2026-05-17T12:00:00.000Z",
    delta: draftPreview.delta,
    eventName: sellerListingMutationUpdatedEvent,
    id: "audit-1",
    productHref: draftPreview.productHref,
    productId: draftPreview.productId,
    productName: draftPreview.productName,
    rollbackAvailable: true,
    status: "applied",
    surface: "route",
    toolId: draftPreview.toolId,
  };
}
