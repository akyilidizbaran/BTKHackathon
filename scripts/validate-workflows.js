#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "src");
const failures = [];

registerTypeScriptRuntime();

const {
  buyers,
  carts,
  inventoryEvents,
  orders,
  productRelations,
  products,
  reviews,
  sellers,
} = require("../src/data/mock");
const { getProductDetail, getSellerOverview } = require("../src/lib/data");
const { scoreProduct } = require("../src/lib/scoring");
const {
  analyzeProductHealthWorkflow,
  buildSmartCartWorkflow,
  generateSellerActionsWorkflow,
} = require("../src/lib/workflows");
const {
  getSellerActionDetailApiData,
  getSellerActionsApiData,
  getSellerBuyerSignalsApiData,
  getSellerOverviewApiData,
  getSellerProductHealthApiData,
  getSellerProductsApiData,
  normalizeSellerActionsFocus,
  resolveSellerActionsFocus,
} = require("../src/lib/api/seller");
const { getSellerActionExplanationApiData } = require("../src/lib/api/seller-action-explanations");
const {
  buyerSmartCartExamples,
  getBuyerSmartCartApiData,
  getDefaultBuyerSmartCartApiData,
  validateBuyerSmartCartRequest,
} = require("../src/lib/api/buyer");
const {
  getBuyerAgentApiData,
  getBuyerAgentApplyApiData,
  getDefaultBuyerAgentApiData,
  validateBuyerAgentApplyRequest,
} = require("../src/lib/api/buyer-agent");
const {
  getBuyerProfileApiData,
  getDefaultBuyerProfileApiData,
  validateBuyerProfilePatchRequest,
} = require("../src/lib/api/buyer-profile");
const { getBuyerCatalogApiData } = require("../src/lib/api/buyer-catalog");
const { getBuyerSmartCartExplanationApiData } = require("../src/lib/api/buyer-smart-cart-explanations");

const validSellerActionTones = new Set(["positive", "neutral", "warning", "danger"]);
const validSellerOwners = new Set(["stok", "operasyon", "icerik", "destek", "pazarlama", "finans"]);
const requiredDemoFlags = [
  "low_stock",
  "slow_mover",
  "negative_review_theme",
  "bundle_candidate",
  "strong_product",
  "listing_quality_issue",
  "margin_pressure",
  "return_risk",
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  validateMockDataIntegrity();
  validateScoringLayer();
  validateSellerWorkflows();
  validateSellerApiContracts();
  await validateSellerActionExplanationApiContracts();
  validateBuyerWorkflows();
  validateBuyerApiContracts();
  validateBuyerCatalogApiContracts();
  validateBuyerAgentApiContracts();
  validateBuyerProfileApiContracts();
  await validateBuyerSmartCartExplanationApiContracts();

  if (failures.length > 0) {
    console.error("Workflow validation failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  const restockExplanation = await getSellerActionExplanationApiData("restock-ergoflex-calisma-sandalyesi", {
    forceFallback: true,
  });
  const buyerExplanation = await getBuyerSmartCartExplanationApiData(
    {
      buyerId: "buyer-aylin",
      prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
    },
    {
      forceFallback: true,
    },
  );

  console.log(
    [
      "Workflow validation passed.",
      `Products: ${products.length}`,
      `Reviews: ${reviews.length}`,
      `Seller actions: ${generateSellerActionsWorkflow("seller-commercepilot")?.actions.length ?? 0}`,
      `Seller action detail endpoint: ${getSellerActionDetailApiData("restock-ergoflex-calisma-sandalyesi")?.contract.endpoint ?? "missing"}`,
      `Seller action explanation endpoint: ${restockExplanation?.contract.endpoint ?? "missing"}`,
      `Buyer smart cart explanation endpoint: ${buyerExplanation.contract.endpoint}`,
      `Seller API products: ${getSellerProductsApiData("seller-commercepilot")?.products.length ?? 0}`,
      `Seller buyer signals: ${getSellerBuyerSignalsApiData("seller-commercepilot")?.signals.length ?? 0}`,
      `Buyer catalog products: ${getBuyerCatalogApiData().products.length}`,
      `Buyer agent endpoint: ${getDefaultBuyerAgentApiData().contract.endpoint}`,
      `Buyer profile endpoint: ${getDefaultBuyerProfileApiData().contract.endpoint}`,
      `Buyer API examples: ${buyerSmartCartExamples.length}`,
      "Buyer prompts: 7",
    ].join("\n"),
  );
}

function registerTypeScriptRuntime() {
  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      const mapped = path.join(srcRoot, request.slice(2));
      const candidates = [
        mapped,
        `${mapped}.ts`,
        `${mapped}.tsx`,
        path.join(mapped, "index.ts"),
        path.join(mapped, "index.tsx"),
      ];
      const matched = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());

      if (matched) {
        return matched;
      }
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  require.extensions[".ts"] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        strict: true,
      },
      fileName: filename,
    }).outputText;

    module._compile(output, filename);
  };
}

function validateMockDataIntegrity() {
  const sellerIds = idSet("seller", sellers);
  const productIds = idSet("product", products);
  const buyerIds = idSet("buyer", buyers);
  idSet("review", reviews);
  idSet("order", orders);
  idSet("inventory event", inventoryEvents);
  idSet("product relation", productRelations);
  idSet("cart", carts);

  products.forEach((product) => {
    assert(sellerIds.has(product.sellerId), `${product.id}: seller bulunamadı`);
    assert(product.price > 0, `${product.id}: fiyat pozitif değil`);
    assert(product.unitCost >= 0, `${product.id}: unitCost negatif`);
    assert(product.stock.onHand >= product.stock.reserved, `${product.id}: reserved stok onHand üstünde`);
    assert(product.metrics.views30d >= product.metrics.orders30d, `${product.id}: sipariş görüntülenmeden fazla`);
  });

  reviews.forEach((review) => {
    assert(productIds.has(review.productId), `${review.id}: product bulunamadı`);
    assert(buyerIds.has(review.buyerId), `${review.id}: buyer bulunamadı`);
    assert(review.rating >= 1 && review.rating <= 5, `${review.id}: rating geçersiz`);
  });

  orders.forEach((order) => {
    assert(sellerIds.has(order.sellerId), `${order.id}: seller bulunamadı`);
    assert(buyerIds.has(order.buyerId), `${order.id}: buyer bulunamadı`);
    order.items.forEach((item) => {
      assert(productIds.has(item.productId), `${order.id}: item product bulunamadı`);
      assert(item.quantity > 0, `${order.id}: item quantity geçersiz`);
    });
    order.returnedProductIds.forEach((productId) => {
      assert(productIds.has(productId), `${order.id}: returned product bulunamadı`);
    });
  });

  inventoryEvents.forEach((event) => {
    assert(productIds.has(event.productId), `${event.id}: inventory product bulunamadı`);
  });

  productRelations.forEach((relation) => {
    assert(productIds.has(relation.sourceProductId), `${relation.id}: source product bulunamadı`);
    assert(productIds.has(relation.relatedProductId), `${relation.id}: related product bulunamadı`);
    assert(relation.sourceProductId !== relation.relatedProductId, `${relation.id}: self relation var`);
    assert(relation.strength >= 0 && relation.strength <= 1, `${relation.id}: relation strength geçersiz`);
  });

  carts.forEach((cart) => {
    assert(buyerIds.has(cart.buyerId), `${cart.id}: buyer bulunamadı`);
    cart.items.forEach((item) => {
      assert(productIds.has(item.productId), `${cart.id}: cart product bulunamadı`);
      assert(item.quantity > 0, `${cart.id}: cart quantity geçersiz`);
    });
  });

  requiredDemoFlags.forEach((flag) => {
    assert(products.some((product) => product.demoStoryFlags.includes(flag)), `${flag}: demo story flag eksik`);
  });
}

function validateScoringLayer() {
  products.forEach((product) => {
    const detail = getProductDetail(product.id);
    assert(Boolean(detail), `${product.id}: product detail üretilemedi`);

    if (!detail) {
      return;
    }

    const scorecard = scoreProduct(detail);
    [
      scorecard.inventory,
      scorecard.reviews,
      scorecard.listing,
      scorecard.shipping,
      scorecard.returns,
      scorecard.profitability,
      scorecard.promotionReadiness,
      scorecard.health,
    ].forEach((score) => validateExplainableScore(`${product.id}:${score.label}`, score));
  });

  const keyProHealth = analyzeProductHealthWorkflow("prod-keypro-mekanik-klavye");
  assert(Boolean(keyProHealth), "KeyPro product health üretilemedi");
  if (keyProHealth) {
    assert(keyProHealth.topInsights.length === 3, "KeyPro product health top 3 insight dönmeli");
    assert(
      keyProHealth.topInsights.every((insight) => isScore(insight.score) && insight.title && insight.summary),
      "KeyPro insight formatı eksik",
    );
    assert(Boolean(keyProHealth.llmReadyContext?.facts), "KeyPro product health LLM context eksik");
  }
}

function validateSellerWorkflows() {
  const sellerId = "seller-commercepilot";
  const result = generateSellerActionsWorkflow(sellerId);
  const overview = getSellerOverview(sellerId);

  assert(Boolean(result), "seller workflow result üretilemedi");
  assert(Boolean(overview), "seller overview üretilemedi");

  if (!result || !overview) {
    return;
  }

  assert(result.sellerId === sellerId, "seller workflow sellerId uyumsuz");
  assert(result.actions.length === 5, `seller workflow top 5 aksiyon dönmeli, gelen ${result.actions.length}`);
  assert(result.analyzedProductCount === overview.products.length, "analyzedProductCount ürün sayısıyla uyumsuz");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(result.generatedAt), "seller generatedAt ISO date değil");
  assertUnique("seller action", result.actions.map((action) => action.id));

  const actionTypes = new Set(result.actions.map((action) => action.type));
  ["restock", "create_bundle", "promote_winner", "protect_margin", "review_attention"].forEach((type) => {
    assert(actionTypes.has(type), `${type}: seller demo top 5 içinde yok`);
  });

  result.actions.forEach((action, index) => {
    const next = result.actions[index + 1];
    if (next) {
      assert(action.priorityScore >= next.priorityScore, `${action.id}: priority sıralaması bozuldu`);
    }

    assert(isScore(action.priorityScore), `${action.id}: priorityScore geçersiz`);
    assert(action.title.length > 0, `${action.id}: title eksik`);
    assert(action.summary.length > 0, `${action.id}: summary eksik`);
    assert(action.category.length > 0 && action.categoryLabel.length > 0, `${action.id}: kategori eksik`);
    assert(action.urgency.length > 0 && action.urgencyLabel.length > 0, `${action.id}: urgency eksik`);
    assert(action.impactLevel.length > 0 && action.impactLabel.length > 0, `${action.id}: impact eksik`);
    assert(action.effortLevel.length > 0 && action.effortLabel.length > 0, `${action.id}: effort eksik`);
    assert(action.timeHorizon.length > 0 && action.timeHorizonLabel.length > 0, `${action.id}: horizon eksik`);
    assert(action.expectedOutcome.length > 0, `${action.id}: expectedOutcome eksik`);
    assert(action.reasoning.length >= 3, `${action.id}: reasoning zayıf`);
    assert(action.productIds.length > 0, `${action.id}: productIds eksik`);
    assert(action.metricHighlights.length >= 3, `${action.id}: metricHighlights eksik`);
    assert(action.todayChecklist.length >= 2, `${action.id}: todayChecklist eksik`);
    assert(Boolean(action.llmReadyContext?.facts), `${action.id}: LLM facts eksik`);
    assert(Boolean(action.llmReadyContext?.instruction), `${action.id}: LLM instruction eksik`);

    if (action.type === "create_bundle" || action.type === "promote_winner") {
      assert(action.urgency !== "critical", `${action.id}: büyüme fırsatı kritik kriz gibi etiketlenmiş`);
    }

    action.metricHighlights.forEach((metric, metricIndex) => {
      assert(metric.label.length > 0, `${action.id}: metric ${metricIndex} label eksik`);
      assert(metric.value.length > 0, `${action.id}: metric ${metricIndex} value eksik`);
      assert(validSellerActionTones.has(metric.tone), `${action.id}: metric ${metricIndex} tone geçersiz`);
    });

    action.todayChecklist.forEach((item, itemIndex) => {
      assert(item.label.length > 0, `${action.id}: checklist ${itemIndex} label eksik`);
      assert(item.detail.length > 0, `${action.id}: checklist ${itemIndex} detail eksik`);
      assert(validSellerOwners.has(item.owner), `${action.id}: checklist ${itemIndex} owner geçersiz`);
    });
  });
}

function validateSellerApiContracts() {
  const sellerId = "seller-commercepilot";
  const overview = getSellerOverviewApiData(sellerId);
  const actions = getSellerActionsApiData(sellerId);
  const negativeReviewActions = getSellerActionsApiData(sellerId, { focus: "negative-reviews" });
  const inventoryActions = getSellerActionsApiData(sellerId, { focus: "inventory" });
  const restockDetail = getSellerActionDetailApiData("restock-ergoflex-calisma-sandalyesi", sellerId);
  const reviewDetail = getSellerActionDetailApiData("review_attention-connectplus-usb-c-hub", sellerId);
  const missingActionDetail = getSellerActionDetailApiData("missing-action", sellerId);
  const buyerSignals = getSellerBuyerSignalsApiData(sellerId);
  const productContract = getSellerProductsApiData(sellerId);
  const stockFocusedProductContract = getSellerProductsApiData(sellerId, { focus: "stock-risk" });
  const returnFocusedProductContract = getSellerProductsApiData(sellerId, { focus: "return-risk" });
  const keyProHealth = getSellerProductHealthApiData("prod-keypro-mekanik-klavye");

  assert(Boolean(overview), "seller overview API contract üretilemedi");
  assert(Boolean(actions), "seller actions API contract üretilemedi");
  assert(Boolean(negativeReviewActions), "seller actions negative review focus contract üretilemedi");
  assert(Boolean(inventoryActions), "seller actions inventory focus contract üretilemedi");
  assert(Boolean(restockDetail), "seller action detail API contract üretilemedi");
  assert(Boolean(reviewDetail), "seller review action detail API contract üretilemedi");
  assert(!missingActionDetail, "olmayan seller action detail undefined dönmeli");
  assert(Boolean(buyerSignals), "seller buyer signals API contract üretilemedi");
  assert(Boolean(productContract), "seller products API contract üretilemedi");
  assert(Boolean(stockFocusedProductContract), "seller products stock focus contract üretilemedi");
  assert(Boolean(returnFocusedProductContract), "seller products return focus contract üretilemedi");
  assert(Boolean(keyProHealth), "seller product health API contract üretilemedi");

  if (overview) {
    assert(overview.contract.envelope === "success/data/error", "overview envelope contract yanlış");
    assert(overview.stats.analyzedProductCount === products.length, "overview analyzedProductCount yanlış");
    assert(overview.topActions.length === 5, "overview top actions top 5 dönmeli");
    assert(overview.operationSignals.length > 0, "overview operation signals boş");
    assert(overview.alertCards.length === 4, "overview alert card sayısı 4 olmalı");
    assert(
      ["negative_reviews", "return_risk", "slow_movers", "stock_risk"].every((id) =>
        overview.alertCards.some((card) => card.id === id),
      ),
      "overview alert card id coverage eksik",
    );
    assert(overview.priorityQueue.length === 4, "overview priority queue top 4 dönmeli");
    assert(
      overview.alertCards.every((card) => card.href.startsWith("/seller/") && card.apiEndpoint.startsWith("/api/seller/")),
      "overview alert route/api endpoint contract yanlış",
    );
    assert(
      overview.alertCards.every((card) => card.evidence.length === 2),
      "overview alert evidence çift metrik dönmeli",
    );
    assert(
      overview.alertCards.some((card) => card.primaryProduct?.image.src === "/catalog/buyer-product-sprite.png"),
      "overview alert ürün görsel sprite contract eksik",
    );
  }

  if (actions) {
    assert(actions.contract.envelope === "success/data/error", "actions envelope contract yanlış");
    assert(actions.contract.endpoint === "/api/seller/actions", "actions endpoint contract yanlış");
    assert(actions.contract.method === "GET", "actions method contract yanlış");
    assert(actions.activeFocus === "all", "actions API default focus all olmalı");
    assert(actions.actions.length === 5, "actions API top 5 dönmeli");
    assert(actions.actionCards.length === actions.actions.length, "actions card/action count uyumsuz");
    assert(actions.actionTypeCoverage.includes("restock"), "actions API restock coverage eksik");
    assert(actions.segments.length >= 5, "actions segment coverage zayıf");
    assert(actions.categoryRoutes.length > 0, "actions kategori route coverage eksik");
    assert(actions.summary.visibleActionCount === actions.actionCards.length, "actions visible count yanlış");
    assert(actions.summary.affectedProductCount > 0, "actions affected product count eksik");
    assert(
      ["all", "stock-risk", "negative-reviews", "return-risk", "slow-movers"].every((id) =>
        actions.segments.some((segment) => segment.id === id),
      ),
      "actions focus segment id coverage eksik",
    );
    assert(
      actions.categoryRoutes.every((segment) => segment.href.startsWith("/seller/actions/")),
      "actions category route href contract yanlış",
    );
    assert(
      actions.segments.every((segment) => segment.apiEndpoint.startsWith("/api/seller/actions")),
      "actions segment api endpoint contract yanlış",
    );
    assert(
      actions.actionCards.every((card) => card.href.startsWith("/seller/actions/") && card.affectedProducts.length > 0),
      "actions card href veya ürün kanıtı eksik",
    );
    assert(
      actions.actionCards.every((card) => card.primaryProduct?.image.src === "/catalog/buyer-product-sprite.png"),
      "actions card ürün görsel sprite contract eksik",
    );
    assert(resolveSellerActionsFocus("customer_voice") === "customer-voice", "actions focus alias customer_voice yanlış");
    assert(normalizeSellerActionsFocus("unknown-focus") === "all", "actions bilinmeyen focus all dönmeli");
  }

  if (negativeReviewActions) {
    assert(negativeReviewActions.activeFocus === "negative-reviews", "negative review actions activeFocus yanlış");
    assert(
      negativeReviewActions.contract.endpoint === "/api/seller/actions?focus=negative-reviews",
      "negative review actions endpoint yanlış",
    );
    assert(negativeReviewActions.actionCards.length > 0, "negative review actions boş olmamalı");
    assert(
      negativeReviewActions.actions.every((action) => action.type === "review_attention"),
      "negative review actions filtre dışı aksiyon döndü",
    );
  }

  if (inventoryActions) {
    assert(inventoryActions.activeFocus === "inventory", "inventory actions activeFocus yanlış");
    assert(inventoryActions.actionCards.length > 0, "inventory actions boş olmamalı");
    assert(
      inventoryActions.actions.every((action) => action.category === "inventory"),
      "inventory actions filtre dışı kategori döndü",
    );
  }

  if (restockDetail) {
    assert(restockDetail.contract.envelope === "success/data/error", "action detail envelope contract yanlış");
    assert(
      restockDetail.contract.endpoint === "/api/seller/actions/restock-ergoflex-calisma-sandalyesi",
      "action detail endpoint contract yanlış",
    );
    assert(restockDetail.contract.method === "GET", "action detail method contract yanlış");
    assert(restockDetail.action.id === "restock-ergoflex-calisma-sandalyesi", "action detail id yanlış");
    assert(restockDetail.actionHref === "/seller/actions/restock-ergoflex-calisma-sandalyesi", "action detail href yanlış");
    assert(restockDetail.affectedProducts.length > 0, "action detail affected products eksik");
    assert(restockDetail.executionPreview.steps.length >= 3, "action detail execution steps eksik");
    assert(restockDetail.executionPreview.generatedDrafts.length >= 2, "action detail generated drafts eksik");
    assert(restockDetail.evidenceSnapshot.length >= 5, "action detail evidence snapshot eksik");
    assert(Boolean(restockDetail.llmReadyContext?.facts), "action detail LLM facts eksik");
  }

  if (reviewDetail) {
    assert(reviewDetail.relatedBuyerSignals.length > 0, "review action detail buyer sinyaliyle eşleşmeli");
  }

  if (buyerSignals) {
    assert(buyerSignals.contract.envelope === "success/data/error", "buyer signals envelope contract yanlış");
    assert(buyerSignals.contract.endpoint === "/api/seller/buyer-signals", "buyer signals endpoint contract yanlış");
    assert(buyerSignals.contract.method === "GET", "buyer signals method contract yanlış");
    assert(buyerSignals.summary.promptCount === buyerSmartCartExamples.length, "buyer signals prompt count yanlış");
    assert(buyerSignals.summary.signalCount === buyerSignals.signals.length, "buyer signals count uyumsuz");
    assert(buyerSignals.summary.affectedProductCount > 0, "buyer signals affected product count eksik");
    assert(buyerSignals.summary.typeCoverage.length >= 3, "buyer signals type coverage zayıf");
    assert(buyerSignals.promptSnapshots.length === buyerSmartCartExamples.length, "buyer signal prompt snapshot sayısı yanlış");
    assert(buyerSignals.signals.length >= 5, "buyer signals satıcı için yetersiz sinyal üretiyor");
    assert(
      buyerSignals.signals.every((signal) => signal.affectedProducts.length > 0 && signal.sellerActionHint.length > 0),
      "buyer signals ürün veya aksiyon hint eksik",
    );
  }

  if (productContract) {
    assert(productContract.contract.envelope === "success/data/error", "products envelope contract yanlış");
    assert(productContract.activeFocus === "all", "products API default focus all olmalı");
    assert(productContract.products.length === products.length, "products API ürün sayısı yanlış");
    assert(productContract.summary.visibleProductCount === productContract.products.length, "products visible count yanlış");
    assert(productContract.summary.averageHealthScore > 0, "products API ortalama sağlık skoru eksik");
    assert(productContract.segments.length === 6, "products segment sayısı yanlış");
    assert(
      ["all", "at-risk", "negative-reviews", "return-risk", "slow-movers", "stock-risk"].every((id) =>
        productContract.segments.some((segment) => segment.id === id),
      ),
      "products segment id coverage eksik",
    );
    assert(
      productContract.segments.every((segment) => segment.href.startsWith("/seller/products")),
      "products segment href contract yanlış",
    );
    assert(
      productContract.segments.every((segment) => segment.apiEndpoint.startsWith("/api/seller/products")),
      "products segment api endpoint contract yanlış",
    );
    assert(productContract.categoryBreakdown.length > 0, "products category breakdown boş");
    assert(Boolean(productContract.spotlightProduct), "products spotlight product eksik");
    assert(productContract.products.every((product) => product.href.startsWith("/seller/products/")), "products API href contract yanlış");
    assert(
      productContract.products.every((product) => product.categoryLabel.length > 0 && product.focusTags.includes("all")),
      "products kategori label veya focus tag contract yanlış",
    );
    assert(
      productContract.products.some((product) => product.riskSignals.some((signal) => signal.id === "stock-risk")),
      "products stock risk sinyali eksik",
    );
    assert(
      productContract.products.some((product) => product.linkedAction?.href.startsWith("/seller/actions/")),
      "products linked action contract eksik",
    );
    assert(
      productContract.products.every((product) => product.image.src === "/catalog/buyer-product-sprite.png"),
      "products API görsel sprite contract yanlış",
    );
    assert(
      productContract.products.every((product) => product.apiHealthEndpoint.startsWith("/api/seller/products/")),
      "products API health endpoint contract yanlış",
    );
  }

  if (stockFocusedProductContract) {
    assert(stockFocusedProductContract.activeFocus === "stock-risk", "stock focused products activeFocus yanlış");
    assert(stockFocusedProductContract.products.length > 0, "stock focused products boş olmamalı");
    assert(
      stockFocusedProductContract.products.every((product) => product.focusTags.includes("stock-risk")),
      "stock focused products filtre dışı ürün döndü",
    );
  }

  if (returnFocusedProductContract) {
    assert(returnFocusedProductContract.activeFocus === "return-risk", "return focused products activeFocus yanlış");
    assert(returnFocusedProductContract.products.length > 0, "return focused products boş olmamalı");
    assert(
      returnFocusedProductContract.products.every((product) => product.focusTags.includes("return-risk")),
      "return focused products filtre dışı ürün döndü",
    );
  }

  if (keyProHealth) {
    assert(keyProHealth.product.slug === "keypro-mekanik-klavye", "KeyPro product slug contract yanlış");
    assert(keyProHealth.product.apiHealthEndpoint === "/api/seller/products/prod-keypro-mekanik-klavye/health", "KeyPro health endpoint yanlış");
    assert(keyProHealth.topInsights.length === 3, "KeyPro health API top 3 insight dönmeli");
    assert(keyProHealth.evidenceSnapshot.length >= 4, "KeyPro health evidence snapshot eksik");
  }
}

async function validateSellerActionExplanationApiContracts() {
  const restockExplanation = await getSellerActionExplanationApiData("restock-ergoflex-calisma-sandalyesi", {
    forceFallback: true,
  });
  const missingExplanation = await getSellerActionExplanationApiData("missing-action", {
    forceFallback: true,
  });

  assert(Boolean(restockExplanation), "seller action explanation API contract üretilemedi");
  assert(!missingExplanation, "olmayan seller action explanation undefined dönmeli");

  if (!restockExplanation) {
    return;
  }

  assert(restockExplanation.contract.envelope === "success/data/error", "action explanation envelope contract yanlış");
  assert(
    restockExplanation.contract.endpoint === "/api/seller/actions/restock-ergoflex-calisma-sandalyesi/explanation",
    "action explanation endpoint contract yanlış",
  );
  assert(restockExplanation.contract.method === "GET", "action explanation method contract yanlış");
  assert(restockExplanation.contract.modelCall === "runtime-only", "action explanation build-time çağrı yapmamalı");
  assert(restockExplanation.action.id === "restock-ergoflex-calisma-sandalyesi", "action explanation action id yanlış");
  assert(restockExplanation.explanation.status === "fallback", "forced action explanation fallback dönmeli");
  assert(restockExplanation.explanation.provider === "deterministic", "forced action explanation provider deterministic olmalı");
  assert(restockExplanation.explanation.model === "gpt-4o-mini", "action explanation default model gpt-4o-mini olmalı");
  assert(restockExplanation.explanation.headline.length > 0, "action explanation headline eksik");
  assert(restockExplanation.explanation.summary.length > 0, "action explanation summary eksik");
  assert(restockExplanation.explanation.evidenceBullets.length >= 3, "action explanation evidence zayıf");
  assert(restockExplanation.explanation.nextBestAction.length > 0, "action explanation nextBestAction eksik");
  assert(restockExplanation.explanation.sellerMessageDraft.length > 0, "action explanation sellerMessageDraft eksik");
  assert(
    restockExplanation.explanation.fallbackReason?.includes("FORCED_FALLBACK"),
    "forced action explanation fallback reason eksik",
  );
  assert(restockExplanation.source.actionEndpoint === "/api/seller/actions/restock-ergoflex-calisma-sandalyesi", "action explanation source endpoint yanlış");
  assert(restockExplanation.source.evidenceCount >= 5, "action explanation source evidence count eksik");
}

function validateBuyerWorkflows() {
  const cases = [
    {
      prompt: "3.000 TL altında hızlı kargolu ev ofis setup kur.",
      buyerId: "buyer-aylin",
      expectedIntent: "home_office_setup",
      expectedBudget: 3000,
      requiredRoles: ["ergonomics", "input_device", "lighting"],
    },
    {
      prompt: "1.500 TL altında kahve seti kur.",
      buyerId: "buyer-deniz",
      expectedIntent: "coffee_starter",
      expectedBudget: 1500,
      requiredRoles: ["brewing", "preparation"],
    },
    {
      prompt: "3 bin TL altında kompakt çalışma masası setup öner.",
      buyerId: "buyer-aylin",
      expectedIntent: "home_office_setup",
      expectedBudget: 3000,
      requiredRoles: ["ergonomics", "input_device"],
    },
    {
      prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
      buyerId: "buyer-aylin",
      expectedIntent: "meeting_setup",
      requiredRoles: ["camera", "audio", "connectivity"],
    },
    {
      prompt: "2 günde gelsin, 2500 TL altında ev ofis ürünleri öner.",
      buyerId: "buyer-aylin",
      expectedIntent: "home_office_setup",
      expectedBudget: 2500,
      expectedMaxDeliveryDays: 2,
      requiredRoles: ["ergonomics", "input_device", "lighting"],
    },
    {
      prompt: "Siyah ve gri renklerde masa takımı diz.",
      buyerId: "buyer-emre",
      expectedIntent: "desk_style_set",
      requiredRoles: ["desk_surface", "organization", "writing"],
      requiresMatchedColor: true,
    },
    {
      prompt: "Spor için kulağı yormayan kablosuz kulaklık öner.",
      buyerId: "buyer-burak",
      expectedIntent: "sports_audio",
      requiredRoles: ["sports_audio"],
    },
  ];

  cases.forEach((testCase) => {
    const result = buildSmartCartWorkflow({ buyerId: testCase.buyerId, prompt: testCase.prompt });
    const selectedRoleKeys = new Set(result.selectedItems.map((item) => item.cartRoleKey));

    assert(result.intent.type === testCase.expectedIntent, `${testCase.prompt}: intent uyumsuz`);
    assert(result.selectedItems.length > 0, `${testCase.prompt}: seçili ürün yok`);
    assert(Boolean(result.llmReadyContext?.facts), `${testCase.prompt}: LLM facts eksik`);
    assert(Array.isArray(result.sellerSignalCandidates), `${testCase.prompt}: sellerSignalCandidates array değil`);

    if (testCase.expectedBudget) {
      assert(result.budget === testCase.expectedBudget, `${testCase.prompt}: budget yanlış`);
      assert(result.softBudgetLimit === Math.round(testCase.expectedBudget * 1.05), `${testCase.prompt}: soft budget yanlış`);
      assert(result.totalPrice <= result.softBudgetLimit, `${testCase.prompt}: soft budget aşıldı`);
    }

    if (testCase.expectedMaxDeliveryDays) {
      assert(result.intent.maxDeliveryDays === testCase.expectedMaxDeliveryDays, `${testCase.prompt}: maxDeliveryDays yanlış`);
    }

    testCase.requiredRoles.forEach((role) => {
      assert(selectedRoleKeys.has(role), `${testCase.prompt}: ${role} rolü eksik`);
    });

    result.selectedItems.forEach((item) => {
      assert(item.cartRoleKey.length > 0 && item.cartRole.length > 0, `${testCase.prompt}: item rolü eksik`);
      assert(isScore(item.confidenceScore), `${testCase.prompt}: item confidence geçersiz`);
      assert(item.reasons.length > 0, `${testCase.prompt}: item reason eksik`);
      assert(Boolean(item.evidence), `${testCase.prompt}: item evidence eksik`);
    });

    if (testCase.requiresMatchedColor) {
      result.selectedItems.forEach((item) => {
        assert(
          Array.isArray(item.evidence.matchedColors) && item.evidence.matchedColors.length > 0,
          `${testCase.prompt}: ${item.productName} renk eşleşmesi taşımıyor`,
        );
      });
    }
  });
}

function validateBuyerApiContracts() {
  const defaultData = getDefaultBuyerSmartCartApiData();
  const meetingData = getBuyerSmartCartApiData({
    buyerId: "buyer-aylin",
    prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
  });
  const emptyValidation = validateBuyerSmartCartRequest({ prompt: "" });
  const longValidation = validateBuyerSmartCartRequest({ prompt: "x".repeat(281) });

  assert(buyerSmartCartExamples.length >= 5, "buyer API örnek prompt sayısı yetersiz");
  assert(defaultData.contract.envelope === "success/data/error", "buyer API envelope contract yanlış");
  assert(defaultData.contract.endpoint === "/api/buyer/smart-cart", "buyer API endpoint contract yanlış");
  assert(defaultData.contract.method === "POST", "buyer API method contract yanlış");
  assert(defaultData.request.buyerId === "buyer-aylin", "buyer API default buyer yanlış");
  assert(defaultData.summary.itemCount === defaultData.result.selectedItems.length, "buyer API itemCount uyumsuz");
  assert(defaultData.summary.warningCount === defaultData.result.warnings.length, "buyer API warningCount uyumsuz");
  assert(defaultData.summary.sellerSignalCount === defaultData.result.sellerSignalCandidates.length, "buyer API seller signal count uyumsuz");
  assert(defaultData.result.intent.type === "home_office_setup", "buyer API default intent yanlış");
  assert(meetingData.result.intent.type === "meeting_setup", "buyer API meeting intent yanlış");
  assert(meetingData.result.selectedItems.some((item) => item.cartRoleKey === "camera"), "buyer API meeting camera rolü eksik");
  assert(!emptyValidation.ok && emptyValidation.code === "PROMPT_REQUIRED", "buyer API boş prompt validation yanlış");
  assert(!longValidation.ok && longValidation.code === "PROMPT_TOO_LONG", "buyer API uzun prompt validation yanlış");
}

function validateBuyerCatalogApiContracts() {
  const catalog = getBuyerCatalogApiData();
  const women = getBuyerCatalogApiData({ category: "kadin-giyim" });
  const priceSorted = getBuyerCatalogApiData({ sort: "price-asc" });

  assert(catalog.contract.endpoint === "/api/buyer/catalog", "buyer catalog endpoint uyumsuz");
  assert(catalog.categories.length === 7, "buyer catalog kategori sayısı 7 olmalı");
  assert(catalog.categories.every((category) => category.image.src === "/catalog/buyer-product-sprite.png"), "buyer catalog kategori görsel sprite uyumsuz");
  assert(catalog.products.length === products.length, "buyer catalog ürün sayısı mock products ile uyumsuz");
  assert(catalog.products.every((product) => product.href.startsWith("/buyer/products/")), "buyer catalog href formatı bozuk");
  assert(catalog.products.every((product) => product.image.src === "/catalog/buyer-product-sprite.png"), "buyer catalog image sprite uyumsuz");
  assert(women.products.length > 0, "buyer catalog Kadın Giyim kategorisi boş olmamalı");
  assert(
    women.products.every((product) => product.categoryId === "kadin-giyim"),
    "buyer catalog kategori filtresi yanlış ürün döndürdü",
  );
  assert(
    priceSorted.products.every((product, index, list) => index === 0 || list[index - 1].price <= product.price),
    "buyer catalog fiyat sıralaması bozuk",
  );
}

function validateBuyerAgentApiContracts() {
  const data = getBuyerAgentApiData({
    buyerId: "buyer-aylin",
    prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
  });
  const defaultData = getDefaultBuyerAgentApiData();
  const applyData = getBuyerAgentApplyApiData({
    items: data.recommendations.map((recommendation) => ({
      productId: recommendation.product.id,
      quantity: recommendation.item.quantity,
    })),
    strategy: "append",
  });
  const invalidStrategy = validateBuyerAgentApplyRequest({
    items: [{ productId: "prod-clearcam-webcam", quantity: 1 }],
    strategy: "merge",
  });
  const emptyItems = validateBuyerAgentApplyRequest({
    items: [],
    strategy: "append",
  });

  assert(defaultData.contract.endpoint === "/api/buyer/agent", "buyer agent endpoint yanlış");
  assert(defaultData.contract.method === "POST", "buyer agent method yanlış");
  assert(data.contract.envelope === "success/data/error", "buyer agent envelope contract yanlış");
  assert(data.contract.source === "buyer-agent-smart-cart", "buyer agent source yanlış");
  assert(data.summary.itemCount === data.recommendations.length, "buyer agent itemCount uyumsuz");
  assert(data.summary.itemCount > 0, "buyer agent öneri dönmeli");
  assert(data.message.content.length > 0, "buyer agent mesajı eksik");
  assert(data.message.confirmationQuestion.includes("sepete"), "buyer agent onay sorusu eksik");
  assert(
    data.recommendations.every((recommendation) => recommendation.product.image.src === "/catalog/buyer-product-sprite.png"),
    "buyer agent ürün görsel contract yanlış",
  );
  assert(
    data.recommendations.every((recommendation) => recommendation.product.href.startsWith("/buyer/products/")),
    "buyer agent ürün href contract yanlış",
  );
  assert(applyData.contract.endpoint === "/api/buyer/agent/apply", "buyer agent apply endpoint yanlış");
  assert(applyData.strategy === "append", "buyer agent apply strategy yanlış");
  assert(applyData.items.length === data.recommendations.length, "buyer agent apply ürün sayısı uyumsuz");
  assert(applyData.summary.itemCount >= data.recommendations.length, "buyer agent apply itemCount eksik");
  assert(applyData.summary.totalPrice > 0, "buyer agent apply total eksik");
  assert(!invalidStrategy.ok && invalidStrategy.code === "INVALID_STRATEGY", "buyer agent invalid strategy validation yanlış");
  assert(!emptyItems.ok && emptyItems.code === "ITEMS_REQUIRED", "buyer agent empty item validation yanlış");
}

function validateBuyerProfileApiContracts() {
  const defaultData = getDefaultBuyerProfileApiData();
  const alternateBuyerData = getBuyerProfileApiData({ buyerId: "buyer-emre" });
  const missingBuyerData = getBuyerProfileApiData({ buyerId: "missing-buyer" });
  const validPatch = validateBuyerProfilePatchRequest({
    budgetBand: "premium",
    buyerId: "buyer-aylin",
    personalNote: "Sade, kaliteli, hızlı kargolu ve logosuz ürünleri öner.",
    preferredColors: ["krem", "beyaz", "krem"],
    selectedPreferenceIds: ["fast_shipping", "premium_quality", "old_money_style"],
  });
  const longNotePatch = validateBuyerProfilePatchRequest({
    buyerId: "buyer-aylin",
    personalNote: "x".repeat(521),
  });
  const invalidPreferencePatch = validateBuyerProfilePatchRequest({
    buyerId: "buyer-aylin",
    personalNote: "Kısa not.",
    selectedPreferenceIds: ["fast_shipping", "invalid-preference"],
  });
  const patchedData = validPatch.ok
    ? getBuyerProfileApiData({
        buyerId: validPatch.value.buyerId,
        editableOverride: validPatch.value,
        method: "PATCH",
      })
    : undefined;

  assert(defaultData.contract.envelope === "success/data/error", "buyer profile envelope contract yanlış");
  assert(defaultData.contract.endpoint === "/api/buyer/profile", "buyer profile endpoint yanlış");
  assert(defaultData.contract.method === "GET", "buyer profile method yanlış");
  assert(defaultData.buyer.id === "buyer-aylin", "buyer profile default buyer yanlış");
  assert(defaultData.preferences.length >= 8, "buyer profile tercih sayısı yetersiz");
  assert(defaultData.preferences.some((preference) => preference.id === "old_money_style"), "buyer profile old-money tercihi eksik");
  assert(defaultData.reviews.length > 0, "buyer profile yorum geçmişi boş olmamalı");
  assert(
    defaultData.reviews.every((review) => review.image.src === "/catalog/buyer-product-sprite.png"),
    "buyer profile yorum görsel sprite contract yanlış",
  );
  assert(defaultData.learnedSignals.length > 0, "buyer profile öğrenilen sinyal üretmeli");
  assert(defaultData.agentPreview.appliedRules.length >= 3, "buyer profile agent preview kuralları eksik");
  assert(defaultData.summary.reviewCount === defaultData.reviews.length, "buyer profile reviewCount uyumsuz");
  assert(Boolean(alternateBuyerData), "buyer profile alternate buyer üretilemedi");
  assert(!missingBuyerData, "olmayan buyer profile undefined dönmeli");
  assert(validPatch.ok, "buyer profile geçerli PATCH reddedildi");

  if (validPatch.ok) {
    assert(validPatch.value.budgetBand === "premium", "buyer profile PATCH budget normalize yanlış");
    assert(validPatch.value.preferredColors.length === 2, "buyer profile PATCH renk unique normalize yanlış");
    assert(validPatch.value.selectedPreferenceIds.length === 3, "buyer profile PATCH preference normalize yanlış");
  }

  assert(!longNotePatch.ok && longNotePatch.code === "NOTE_TOO_LONG", "buyer profile uzun not validation yanlış");
  assert(invalidPreferencePatch.ok, "buyer profile invalid preference body tamamen reddedilmemeli");

  if (invalidPreferencePatch.ok) {
    assert(
      invalidPreferencePatch.value.selectedPreferenceIds.length === 1 &&
        invalidPreferencePatch.value.selectedPreferenceIds[0] === "fast_shipping",
      "buyer profile invalid preference filtreleme yanlış",
    );
  }

  assert(Boolean(patchedData), "buyer profile PATCH data üretilemedi");

  if (patchedData) {
    assert(patchedData.contract.method === "PATCH", "buyer profile PATCH method contract yanlış");
    assert(patchedData.summary.preferredColorCount === 2, "buyer profile PATCH color count yanlış");
    assert(
      patchedData.agentPreview.appliedRules.some((rule) => rule.includes("premium")),
      "buyer profile PATCH agent preview bütçe kuralını taşımıyor",
    );
  }
}

async function validateBuyerSmartCartExplanationApiContracts() {
  const explanation = await getBuyerSmartCartExplanationApiData(
    {
      buyerId: "buyer-aylin",
      prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
    },
    {
      forceFallback: true,
    },
  );

  assert(explanation.contract.envelope === "success/data/error", "buyer explanation envelope contract yanlış");
  assert(explanation.contract.endpoint === "/api/buyer/smart-cart/explanation", "buyer explanation endpoint yanlış");
  assert(explanation.contract.method === "POST", "buyer explanation method yanlış");
  assert(explanation.contract.modelCall === "runtime-only", "buyer explanation build-time çağrı yapmamalı");
  assert(explanation.summary.intentLabel === "Toplantı setup", "buyer explanation intent label yanlış");
  assert(explanation.summary.itemCount >= 3, "buyer explanation item count zayıf");
  assert(explanation.explanation.status === "fallback", "forced buyer explanation fallback dönmeli");
  assert(explanation.explanation.provider === "deterministic", "forced buyer explanation provider deterministic olmalı");
  assert(explanation.explanation.model === "gpt-4o-mini", "buyer explanation default model gpt-4o-mini olmalı");
  assert(explanation.explanation.headline.length > 0, "buyer explanation headline eksik");
  assert(explanation.explanation.summary.length > 0, "buyer explanation summary eksik");
  assert(explanation.explanation.evidenceBullets.length >= 3, "buyer explanation evidence zayıf");
  assert(explanation.explanation.buyerDecision.length > 0, "buyer explanation buyerDecision eksik");
  assert(explanation.explanation.riskNote.length > 0, "buyer explanation riskNote eksik");
  assert(explanation.explanation.sellerSignalBridge.length > 0, "buyer explanation sellerSignalBridge eksik");
  assert(explanation.explanation.cartAdjustment.length > 0, "buyer explanation cartAdjustment eksik");
  assert(
    explanation.explanation.fallbackReason?.includes("FORCED_FALLBACK"),
    "forced buyer explanation fallback reason eksik",
  );
  assert(explanation.source.smartCartEndpoint === "/api/buyer/smart-cart", "buyer explanation source endpoint yanlış");
  assert(explanation.source.selectedItemCount >= 3, "buyer explanation source selected count eksik");
  assert(explanation.source.sellerSignalCount > 0, "buyer explanation source seller signal eksik");

  const noBudgetGuard = await getBuyerSmartCartExplanationApiData(
    {
      buyerId: "buyer-emre",
      prompt: "Siyah ve gri renklerde masa takımı diz.",
    },
    {
      modelTextOverride: JSON.stringify({
        buyerDecision: "Bütçenizi aşmadan bu sepet doğrudan alınabilir.",
        cartAdjustment: "Sepet bütçe içinde kalıyor; ek ürün ekleyebilirsin.",
        evidenceBullets: [
          "Toplam 2950 TL, bütçeniz 3000 TL ile uyumlu.",
          "Siyah ve gri ürünler masa stili talebini karşılıyor.",
          "Kargo sinyali güçlü olan ürünler seçildi.",
          "Bütçe altında kalan aksesuarlar tamamlayıcı olabilir.",
        ],
        headline: "Masa stili bütçe içinde",
        riskNote: "Bütçe altında olduğu için fiyat riski yok.",
        sellerSignalBridge: "Satıcı tarafına renk uyumu talebi döner.",
        summary: "Bu sepet 3000 TL bütçeniz içinde kalıyor.",
      }),
    },
  );
  const guardedNoBudgetText = JSON.stringify(noBudgetGuard.explanation).toLocaleLowerCase("tr-TR");

  assert(noBudgetGuard.summary.budgetStatusLabel === "Bütçe belirtilmedi", "no-budget explanation status yanlış");
  assert(
    noBudgetGuard.explanation.summary.toLocaleLowerCase("tr-TR").includes("bütçe belirtilmedi"),
    "no-budget explanation summary bütçe guard fallback'ine dönmeli",
  );
  assert(noBudgetGuard.explanation.evidenceBullets.length >= 3, "no-budget explanation guard evidence zayıf");
  assert(
    !guardedNoBudgetText.includes("bütçeniz 3000") &&
      !guardedNoBudgetText.includes("bütçeniz 3.000") &&
      !guardedNoBudgetText.includes("bütçenizi") &&
      !guardedNoBudgetText.includes("bütçe içinde") &&
      !guardedNoBudgetText.includes("bütçe altında"),
    "no-budget explanation olmayan bütçe iddiasını UI contract'ına geçiriyor",
  );
}

function validateExplainableScore(label, score) {
  assert(isScore(score.score), `${label}: score 0-100 dışında`);
  assert(score.label.length > 0, `${label}: label eksik`);
  assert(score.summary.length > 0, `${label}: summary eksik`);
  assert(score.drivers.length > 0, `${label}: drivers eksik`);
  assert(Boolean(score.evidence), `${label}: evidence eksik`);
  assert(score.recommendedFocus.length > 0, `${label}: recommendedFocus eksik`);
}

function idSet(label, items) {
  const ids = items.map((item) => item.id);
  assertUnique(label, ids);
  return new Set(ids);
}

function assertUnique(label, ids) {
  const seen = new Set();
  ids.forEach((id) => {
    assert(typeof id === "string" && id.length > 0, `${label}: boş id var`);
    assert(!seen.has(id), `${label}: duplicate id ${id}`);
    seen.add(id);
  });
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function isScore(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
