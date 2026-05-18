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
  validateBuyerAgentRequest,
  validateBuyerAgentApplyRequest,
} = require("../src/lib/api/buyer-agent");
const {
  getBuyerProductProfileAlert,
} = require("../src/lib/agents/buyer-profile-product-alerts");
const {
  getDefaultSellerAgentApiData,
  getSellerAgentApiData,
  sellerAgentExamples,
  validateSellerAgentRequest,
} = require("../src/lib/api/seller-agent");
const {
  getSellerListingMutationApplyApiData,
  sellerAgentApplyEndpoint,
  sellerAgentListingApplyToolId,
  sellerListingMutationStorageKey,
  sellerListingMutationUpdatedEvent,
  validateSellerListingMutationApplyRequest,
} = require("../src/lib/agents/seller-listing-apply");
const {
  getBuyerProfileApiData,
  getDefaultBuyerProfileApiData,
  validateBuyerProfilePatchRequest,
} = require("../src/lib/api/buyer-profile");
const {
  getDefaultSellerProfileApiData,
  getSellerProfileApiData,
  validateSellerProfilePatchRequest,
} = require("../src/lib/api/seller-profile");
const {
  agentPromptTemplates,
  agentToolRegistry,
  createAgentRuntimeSnapshot,
  getSharedAgentRuntimeApiData,
  sharedAgentRuntimeEndpoint,
} = require("../src/lib/agents/runtime");
const {
  createDefaultFloatingAgentStore,
  createFloatingAgentContext,
  floatingAgentStorageKey,
  floatingAgentUpdatedEvent,
  normalizeFloatingAgentPathname,
} = require("../src/lib/agents/floating-agent");
const {
  floatingAgentEndpoint,
  getFloatingAgentApiData,
  getDefaultFloatingAgentApiData,
  validateFloatingAgentRequest,
} = require("../src/lib/api/floating-agent");
const {
  demoRehearsalRoute,
  getDemoRehearsalData,
} = require("../src/lib/demo/rehearsal");
const { getBuyerCatalogApiData } = require("../src/lib/api/buyer-catalog");
const { getBuyerSmartCartExplanationApiData } = require("../src/lib/api/buyer-smart-cart-explanations");
const {
  getReviewIntelligenceApiData,
  reviewIntelligenceEndpoint,
  validateReviewIntelligenceRequest,
} = require("../src/lib/api/review-intelligence");
const {
  generateLlmJson,
  generateLlmText,
  getConfiguredLlmModel,
  getLlmModelForProvider,
  normalizeLlmString,
  normalizeLlmStringArray,
  normalizeLlmProvider,
  parseLlmJsonObject,
} = require("../src/lib/llm");

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
  await validateLlmProviderContracts();
  validateScoringLayer();
  validateSellerWorkflows();
  validateSellerApiContracts();
  await validateReviewIntelligenceApiContracts();
  await validateSellerActionExplanationApiContracts();
  validateBuyerWorkflows();
  validateBuyerApiContracts();
  validateBuyerCatalogApiContracts();
  await validateBuyerAgentApiContracts();
  await validateSellerAgentApiContracts();
  await validateSellerListingMutationApplyContracts();
  validateSharedAgentRuntimeContracts();
  validateFloatingAgentContracts();
  await validateFloatingAgentApiContracts();
  validateDemoRehearsalContracts();
  validateAgentTraceUiContracts();
  validateAgentComponentExtractionContracts();
  validateSellerProfileApiContracts();
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
      `Review intelligence endpoint: ${reviewIntelligenceEndpoint}`,
      `Buyer smart cart explanation endpoint: ${buyerExplanation.contract.endpoint}`,
      `Seller API products: ${getSellerProductsApiData("seller-commercepilot")?.products.length ?? 0}`,
      `Seller buyer signals: ${getSellerBuyerSignalsApiData("seller-commercepilot")?.signals.length ?? 0}`,
      `Buyer catalog products: ${getBuyerCatalogApiData().products.length}`,
      `Buyer agent endpoint: ${getDefaultBuyerAgentApiData().contract.endpoint}`,
      `Seller agent endpoint: ${getDefaultSellerAgentApiData().contract.endpoint}`,
      `Floating agent endpoint: ${getDefaultFloatingAgentApiData().contract.endpoint}`,
      `Shared agent runtime endpoint: ${sharedAgentRuntimeEndpoint}`,
      `Seller profile endpoint: ${getDefaultSellerProfileApiData().contract.endpoint}`,
      `Buyer profile endpoint: ${getDefaultBuyerProfileApiData().contract.endpoint}`,
      `Buyer API examples: ${buyerSmartCartExamples.length}`,
      "Buyer prompts: 7",
    ].join("\n"),
  );
}

async function validateLlmProviderContracts() {
  const previousEnv = snapshotLlmEnv();

  try {
    assert(normalizeLlmProvider("openai") === "openai", "LLM provider openai normalize edilemedi");
    assert(normalizeLlmProvider("Gemini") === "gemini", "LLM provider gemini normalize edilemedi");
    assert(normalizeLlmProvider("deterministic") === "deterministic", "LLM provider deterministic normalize edilemedi");
    assert(!normalizeLlmProvider("anthropic"), "unsupported LLM provider normalize edilmemeli");
    assert(
      getLlmModelForProvider("openai") === (process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"),
      "OpenAI default model contract yanlış",
    );

    process.env.LLM_PROVIDER = "deterministic";
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const deterministic = await generateLlmText({
      fallbackText: "fallback-ok",
      input: "test input",
      instructions: "test instruction",
    });

    assert(deterministic.status === "fallback", "deterministic provider fallback dönmeli");
    assert(deterministic.provider === "deterministic", "deterministic provider yanlış");
    assert(deterministic.error?.code === "DETERMINISTIC_LLM_PROVIDER", "deterministic fallback code yanlış");
    assert(deterministic.text === "fallback-ok", "deterministic fallback text yanlış");

    process.env.LLM_PROVIDER = "gemini";
    process.env.GEMINI_MODEL = "gemini-3-flash-preview";
    delete process.env.GEMINI_API_KEY;

    const missingGeminiKey = await generateLlmText({
      fallbackText: "gemini-fallback-ok",
      input: "test input",
      instructions: "test instruction",
    });

    assert(missingGeminiKey.status === "fallback", "Gemini key yokken fallback dönmeli");
    assert(missingGeminiKey.provider === "deterministic", "Gemini key yokken deterministic provider dönmeli");
    assert(missingGeminiKey.model === "gemini-3-flash-preview", "Gemini fallback model contract yanlış");
    assert(missingGeminiKey.error?.code === "GEMINI_API_KEY_MISSING", "Gemini missing key code yanlış");

    process.env.LLM_PROVIDER = "unsupported-provider";

    const unsupportedProvider = await generateLlmText({
      fallbackText: "unsupported-fallback-ok",
      input: "test input",
      instructions: "test instruction",
    });

    assert(unsupportedProvider.status === "fallback", "unsupported provider fallback dönmeli");
    assert(unsupportedProvider.provider === "deterministic", "unsupported provider deterministic dönmeli");
    assert(unsupportedProvider.error?.code === "UNSUPPORTED_LLM_PROVIDER", "unsupported provider code yanlış");

    const fencedJson = parseLlmJsonObject('```json\n{"title":"  Test ","bullets":[" A ","B",""]}\n```');

    assert(fencedJson?.title === "  Test ", "LLM JSON fenced parse contract yanlış");
    assert(normalizeLlmString(fencedJson?.title, "fallback") === "Test", "LLM normalize string contract yanlış");
    assert(
      normalizeLlmStringArray(fencedJson?.bullets, ["fallback"], 2).join("|") === "A|B",
      "LLM normalize string array contract yanlış",
    );

    const forcedJson = await generateLlmJson({
      fallbackValue: { title: "Fallback", bullets: ["Fallback bullet"] },
      forceFallback: true,
      input: "json input",
      instructions: "json instructions",
      validate: (value, fallbackValue) => ({
        ok: true,
        value: {
          bullets: normalizeLlmStringArray(value.bullets, fallbackValue.bullets, 3),
          title: normalizeLlmString(value.title, fallbackValue.title),
        },
      }),
    });

    assert(forcedJson.status === "fallback", "forced JSON fallback status yanlış");
    assert(forcedJson.provider === "deterministic", "forced JSON provider deterministic olmalı");
    assert(forcedJson.model === getConfiguredLlmModel(), "forced JSON model configured model olmalı");
    assert(forcedJson.value.title === "Fallback", "forced JSON fallback value yanlış");
    assert(forcedJson.fallbackReason?.includes("FORCED_FALLBACK"), "forced JSON fallback reason eksik");

    const invalidJson = await generateLlmJson({
      fallbackValue: { title: "Schema fallback" },
      input: "json input",
      instructions: "json instructions",
      modelTextOverride: '{"title":""}',
      validate: (value) => {
        const title = normalizeLlmString(value.title, "");

        return title
          ? { ok: true, value: { title } }
          : {
              code: "TITLE_REQUIRED",
              message: "title alanı zorunlu.",
              ok: false,
            };
      },
    });

    assert(invalidJson.status === "fallback", "invalid JSON validation fallback dönmeli");
    assert(invalidJson.value.title === "Schema fallback", "invalid JSON validation fallback value yanlış");
    assert(invalidJson.fallbackReason?.includes("TITLE_REQUIRED"), "invalid JSON fallback reason code eksik");
  } finally {
    restoreLlmEnv(previousEnv);
  }
}

function snapshotLlmEnv() {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  };
}

function restoreLlmEnv(snapshot) {
  Object.entries(snapshot).forEach(([key, value]) => {
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  });
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

async function validateReviewIntelligenceApiContracts() {
  const forcedData = await getReviewIntelligenceApiData(
    {
      productId: "prod-connectplus-usb-c-hub",
      sellerId: "seller-commercepilot",
    },
    { forceFallback: true },
  );
  const modelDrivenData = await getReviewIntelligenceApiData(
    {
      productId: "prod-connectplus-usb-c-hub",
      sellerId: "seller-commercepilot",
    },
    {
      modelTextOverride: JSON.stringify({
        buyerFacingWarning: "LLM uyarısı: uyumluluk ve güç geçişi bilgisini satın almadan önce kontrol et.",
        listingFixSuggestions: [
          "LLM önerisi: cihaz uyumluluğu, HDMI ve güç geçişi değerlerini teknik özelliklerde ayır.",
          "LLM önerisi: uzun kullanımda ısınma beklentisini SSS alanına taşı.",
        ],
        repeatedComplaintThemes: ["uyumluluk", "olmayan-tema"],
        reviewClusters: [
          {
            id: "llm-compatibility",
            reviewIds: ["rev-026", "missing-review"],
            sentiment: "negative",
            severity: "high",
            summary: "LLM cluster: uyumluluk ve güç geçişi belirsizliği tekrar ediyor.",
            theme: "uyumluluk",
          },
        ],
        riskSummary: "LLM risk özeti: uyumluluk ve iade riski ürün sayfasında cevaplanmalı.",
        sellerReplyDrafts: [
          {
            body: "LLM yanıtı: cihaz uyumluluğu ve güç geçişi bilgisini daha açık hale getiriyoruz.",
            reviewId: "rev-026",
            title: "LLM destek yanıtı",
          },
          {
            body: "Bu geçersiz review id temizlenmeli.",
            reviewId: "missing-review",
            title: "Geçersiz yanıt",
          },
        ],
      }),
    },
  );
  const missingProduct = await getReviewIntelligenceApiData({
    productId: "missing-product",
  });
  const validRequest = validateReviewIntelligenceRequest({
    productId: "prod-connectplus-usb-c-hub",
  });
  const missingRequest = validateReviewIntelligenceRequest({
    productId: " ",
  });

  assert(Boolean(forcedData), "review intelligence forced data üretilemedi");
  assert(Boolean(modelDrivenData), "review intelligence model override data üretilemedi");
  assert(!missingProduct, "olmayan ürün review intelligence undefined dönmeli");
  assert(validRequest.ok, "review intelligence valid request doğrulanmalı");
  assert(!missingRequest.ok && missingRequest.code === "PRODUCT_REQUIRED", "review intelligence missing product validation yanlış");

  if (!forcedData || !modelDrivenData) {
    return;
  }

  assert(forcedData.contract.endpoint === reviewIntelligenceEndpoint, "review intelligence endpoint yanlış");
  assert(forcedData.contract.method === "POST", "review intelligence method yanlış");
  assert(forcedData.contract.envelope === "success/data/error", "review intelligence envelope yanlış");
  assert(forcedData.contract.modelCall === "runtime-only", "review intelligence build-time çağrı yapmamalı");
  assert(forcedData.product.id === "prod-connectplus-usb-c-hub", "review intelligence product id yanlış");
  assert(forcedData.reviewStats.sourceReviewCount >= 2, "review intelligence source review count zayıf");
  assert(forcedData.intelligence.status === "fallback", "forced review intelligence fallback dönmeli");
  assert(forcedData.intelligence.provider === "deterministic", "forced review intelligence provider deterministic olmalı");
  assert(forcedData.intelligence.fallbackReason?.includes("FORCED_FALLBACK"), "forced review intelligence fallback reason eksik");
  assert(forcedData.intelligence.reviewClusters.length > 0, "review intelligence cluster eksik");
  assert(forcedData.intelligence.repeatedComplaintThemes.includes("uyumluluk"), "review intelligence repeated theme eksik");
  assert(forcedData.intelligence.listingFixSuggestions.length >= 2, "review intelligence listing fix önerisi eksik");
  assert(forcedData.intelligence.sellerReplyDrafts.length > 0, "review intelligence seller reply draft eksik");
  assert(forcedData.intelligence.buyerFacingWarning.length > 0, "review intelligence buyer warning eksik");
  assert(
    forcedData.intelligence.reviewClusters.every((cluster) =>
      cluster.reviewIds.every((reviewId) => forcedData.source.sourceReviewIds.includes(reviewId))
    ),
    "review intelligence kaynak dışı review id taşıyor",
  );
  assert(modelDrivenData.intelligence.status === "generated", "review intelligence model override generated olmalı");
  assert(
    modelDrivenData.intelligence.reviewClusters[0]?.summary.includes("LLM cluster"),
    "review intelligence LLM cluster summary uygulanmadı",
  );
  assert(
    !modelDrivenData.intelligence.reviewClusters[0]?.reviewIds.includes("missing-review"),
    "review intelligence invalid review id filtrelenmedi",
  );
  assert(
    !modelDrivenData.intelligence.repeatedComplaintThemes.includes("olmayan-tema"),
    "review intelligence invalid theme filtrelenmedi",
  );
  assert(
    modelDrivenData.intelligence.sellerReplyDrafts.some((draft) => draft.body.includes("LLM yanıtı")),
    "review intelligence LLM seller reply uygulanmadı",
  );
}

async function validateSellerActionExplanationApiContracts() {
  const restockExplanation = await getSellerActionExplanationApiData("restock-ergoflex-calisma-sandalyesi", {
    forceFallback: true,
  });
  const reviewExplanation = await getSellerActionExplanationApiData("review_attention-connectplus-usb-c-hub", {
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
  assert(Boolean(reviewExplanation), "review action explanation üretilemedi");

  if (reviewExplanation) {
    assert(
      reviewExplanation.source.reviewIntelligenceProductId === "prod-connectplus-usb-c-hub",
      "review action explanation review intelligence product id eksik",
    );
    assert(
      reviewExplanation.source.reviewIntelligenceStatus === "fallback",
      "review action explanation review intelligence status yanlış",
    );
    assert(
      reviewExplanation.explanation.summary.includes("yorum güveni") ||
        reviewExplanation.explanation.summary.includes("Review") ||
        reviewExplanation.explanation.summary.includes("yorum"),
      "review action explanation review intelligence özetini taşımıyor",
    );
  }
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
      prompt: "iki bin tl altında mevcut ürünleri sırala.",
      buyerId: "buyer-aylin",
      expectedIntent: "generic",
      expectedBudget: 2000,
      requiredRoles: [],
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

async function validateBuyerAgentApiContracts() {
  const data = await getBuyerAgentApiData(
    {
      buyerId: "buyer-aylin",
      prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
    },
    { forceFallback: true },
  );
  const defaultData = getDefaultBuyerAgentApiData();
  const lastProductId = data.recommendations.at(-1)?.product.id ?? data.recommendations[0]?.product.id;
  const modelRankOverride = await getBuyerAgentApiData(
    {
      buyerId: "buyer-aylin",
      prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
    },
    {
      modelTextOverride: JSON.stringify({
        cartStrategySuggestion: "replace",
        confirmationQuestion: "Bu LLM sıralamasını sepete ekleyeyim mi?",
        messageContent: "Toplantı setup için en güçlü adayı önceledim.",
        rankedProductIds: ["missing-product", lastProductId, data.recommendations[0]?.product.id],
        recommendationReasons: {
          [lastProductId]: "LLM gerekçesi: toplantı akışındaki rolü daha acil.",
        },
        riskNotes: ["LLM risk notu: stok ve teslimat sinyalini kontrol et."],
      }),
    },
  );
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
  const unsupportedPrompt = validateBuyerAgentRequest({
    buyerId: "buyer-aylin",
    prompt: "2000 TL altında PlayStation 5 öner.",
  });
  const unsupportedNarrativeOverride = await getBuyerAgentApiData(
    {
      buyerId: "buyer-aylin",
      prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
    },
    {
      modelTextOverride: JSON.stringify({
        cartStrategySuggestion: "append",
        confirmationQuestion: "Bu iPhone seçkisini sepete ekleyeyim mi?",
        messageContent: "iPhone ile uyumlu bir toplantı seti hazırladım.",
        rankedProductIds: data.recommendations.map((recommendation) => recommendation.product.id),
        recommendationReasons: {
          [data.recommendations[0]?.product.id]: "iPhone ile en uyumlu aksesuar olduğu için seçildi.",
        },
        riskNotes: ["iPhone stok durumunu kontrol et."],
      }),
    },
  );

  assert(defaultData.contract.endpoint === "/api/buyer/agent", "buyer agent endpoint yanlış");
  assert(defaultData.contract.method === "POST", "buyer agent method yanlış");
  assert(data.contract.envelope === "success/data/error", "buyer agent envelope contract yanlış");
  assert(data.contract.source === "buyer-agent-smart-cart", "buyer agent source yanlış");
  assert(data.runtime.role === "buyer", "buyer agent runtime role yanlış");
  assert(data.runtime.promptTemplate.id === "buyer-smart-cart-route", "buyer agent prompt registry id yanlış");
  assert(data.runtime.toolPlan.some((tool) => tool.id === "buyer.catalog.search"), "buyer agent catalog tool plan eksik");
  assert(
    data.runtime.toolPlan.some((tool) => tool.id === "buyer.agent.cart.apply.preview" && tool.requiresApproval),
    "buyer agent apply approval tool plan eksik",
  );
  assert(data.runtime.handoff.nextMilestone === "8R", "buyer agent runtime handoff 8R olmalı");
  validateAgentTrace("buyer agent", data.agentTrace, {
    role: "buyer",
    surface: "route",
    toolIds: ["buyer.agent.cart.apply.preview"],
  });
  assert(data.applyPreview.toolId === "buyer.agent.cart.apply.preview", "buyer agent apply preview tool id yanlış");
  assert(data.applyPreview.endpoint === "/api/buyer/agent/apply", "buyer agent apply preview endpoint yanlış");
  assert(data.applyPreview.requiresApproval, "buyer agent apply preview onay sınırı eksik");
  assert(data.applyPreview.items.length === data.recommendations.length, "buyer agent apply preview item sayısı uyumsuz");
  assert(
    data.applyPreview.strategies.some((strategy) => strategy.strategy === "append") &&
      data.applyPreview.strategies.some((strategy) => strategy.strategy === "replace"),
    "buyer agent apply preview append/replace stratejileri eksik",
  );
  assert(
    data.applyPreview.sharedSurfaces.includes("route") && data.applyPreview.sharedSurfaces.includes("floating"),
    "buyer agent apply preview shared surfaces eksik",
  );
  assert(data.summary.itemCount === data.recommendations.length, "buyer agent itemCount uyumsuz");
  assert(data.summary.itemCount > 0, "buyer agent öneri dönmeli");
  assert(data.message.content.length > 0, "buyer agent mesajı eksik");
  assert(data.message.confirmationQuestion.includes("sepete"), "buyer agent onay sorusu eksik");
  assert(data.orchestration.status === "fallback", "forced buyer agent orchestration fallback dönmeli");
  assert(data.orchestration.provider === "deterministic", "forced buyer agent orchestration provider deterministic olmalı");
  assert(data.orchestration.rankedProductIds.length === data.recommendations.length, "buyer agent ranked product ids eksik");
  assert(data.orchestration.cartStrategySuggestion === "append", "forced buyer agent default strategy append olmalı");
  assert(data.orchestration.fallbackReason?.includes("FORCED_FALLBACK"), "forced buyer agent fallback reason eksik");
  assert(modelRankOverride.orchestration.status === "generated", "model override buyer agent generated dönmeli");
  assert(modelRankOverride.orchestration.cartStrategySuggestion === "replace", "model override strategy normalize yanlış");
  assert(!modelRankOverride.orchestration.rankedProductIds.includes("missing-product"), "buyer agent LLM katalog dışı product id geçiriyor");
  assert(
    modelRankOverride.recommendations[0]?.primaryReason.includes("LLM gerekçesi"),
    "buyer agent LLM recommendation reason uygulanmadı",
  );
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
  assert(applyData.sharedMutation.toolId === "buyer.agent.cart.apply.preview", "buyer agent shared mutation tool id yanlış");
  assert(applyData.sharedMutation.requiresApproval, "buyer agent shared mutation onay sınırı eksik");
  assert(applyData.sharedMutation.clientAction.helper === "applyBuyerAgentCartMutation", "buyer agent shared mutation client helper yanlış");
  assert(applyData.sharedMutation.stateTarget.storageKey === "commercepilot.buyerCart.v1", "buyer agent shared mutation storage key yanlış");
  assert(applyData.sharedMutation.clientAction.eventName === "commercepilot:buyer-cart-updated", "buyer agent shared mutation event yanlış");
  assert(
    applyData.sharedMutation.sharedSurfaces.includes("route") &&
      applyData.sharedMutation.sharedSurfaces.includes("floating"),
    "buyer agent shared mutation route/floating surface eksik",
  );
  assert(applyData.items.length === data.recommendations.length, "buyer agent apply ürün sayısı uyumsuz");
  assert(applyData.summary.itemCount >= data.recommendations.length, "buyer agent apply itemCount eksik");
  assert(applyData.summary.totalPrice > 0, "buyer agent apply total eksik");
  assert(!invalidStrategy.ok && invalidStrategy.code === "INVALID_STRATEGY", "buyer agent invalid strategy validation yanlış");
  assert(!emptyItems.ok && emptyItems.code === "ITEMS_REQUIRED", "buyer agent empty item validation yanlış");
  assert(
    !unsupportedPrompt.ok && unsupportedPrompt.code === "BUYER_CATALOG_UNSUPPORTED_PROMPT",
    "buyer agent unsupported katalog prompt'u route validation'da engellenmeli",
  );
  assert(
    !unsupportedNarrativeOverride.message.content.toLocaleLowerCase("tr-TR").includes("iphone") &&
      !unsupportedNarrativeOverride.message.confirmationQuestion.toLocaleLowerCase("tr-TR").includes("iphone") &&
      Object.values(unsupportedNarrativeOverride.orchestration.recommendationReasons).every(
        (reason) => !reason.toLocaleLowerCase("tr-TR").includes("iphone"),
      ),
    "buyer agent LLM narrative katalog dışı ürün terimini geçirmemeli",
  );
}

async function validateSellerAgentApiContracts() {
  const defaultData = getDefaultSellerAgentApiData();
  const slowMoverData = await getSellerAgentApiData(
    {
      prompt: "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
      sellerId: "seller-commercepilot",
    },
    { forceFallback: true },
  );
  const negativeReviewData = await getSellerAgentApiData(
    {
      prompt: "Negatif yorum gelen ürünleri grupla.",
      sellerId: "seller-commercepilot",
    },
    { forceFallback: true },
  );
  const modelProduct = slowMoverData.productFindings[0].product;
  const modelActionId = slowMoverData.actionSuggestions[0].id;
  const modelDrivenData = await getSellerAgentApiData(
    {
      prompt: "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
      sellerId: "seller-commercepilot",
    },
    {
      modelTextOverride: JSON.stringify({
        activeFocus: "slow-movers",
        actionReasons: {
          [modelActionId]: "LLM action gerekçesi: kampanya metni ve fiyat indirimi aynı onay akışına bağlanmalı.",
        },
        draft: {
          campaignLabel: "LLM vitrin hızlandırma",
          description: "LLM taslağı satış hızı düşük üründe itirazı ve kampanya netliğini aynı açıklamada toplar.",
          price: Math.round(modelProduct.price * 0.94),
          productId: modelProduct.id,
          rationale: "LLM draft onay sonrası uygulanacak fiyat ve içerik önerisini hazırlar.",
          title: `${modelProduct.name} | LLM hızlandırılmış vitrin`,
        },
        messageContent: "LLM orchestration satılmayan ürün adaylarını ürün kanıtı, action etkisi ve onaylı draft ile sıraladı.",
        messageHeadline: "LLM satıcı odağını ve draft taslağını hazırladı.",
        nextStepDetails: {
          "approval-boundary": "LLM taslak apply işlemi için satıcı onayı bekler.",
          "open-action": "LLM önce kampanya action detayının açılmasını önerir.",
          "open-products": "LLM ürün kanıtını satılmayanlar filtresinde açar.",
        },
        productReasons: {
          [modelProduct.id]: "LLM gerekçesi: düşük sipariş hızı ve bağlı kampanya action'ı aynı anda öncelik verdiriyor.",
        },
        rankedActionIds: [modelActionId, "invalid-action"],
        rankedProductIds: [modelProduct.id, "invalid-product"],
        safetyNote: "Onay olmadan fiyat, kampanya veya listeleme değişikliği yapmam.",
      }),
    },
  );
  const validRequest = validateSellerAgentRequest({
    prompt: "Stok riski olan ürünleri göster.",
  });
  const missingPrompt = validateSellerAgentRequest({
    prompt: "   ",
  });
  const longPrompt = validateSellerAgentRequest({
    prompt: "x".repeat(361),
  });

  assert(sellerAgentExamples.length >= 4, "seller agent örnek prompt coverage eksik");
  assert(defaultData.contract.endpoint === "/api/seller/agent", "seller agent endpoint yanlış");
  assert(defaultData.contract.method === "POST", "seller agent method yanlış");
  assert(defaultData.contract.envelope === "success/data/error", "seller agent envelope contract yanlış");
  assert(defaultData.contract.source === "seller-agent-deterministic-workflow", "seller agent source yanlış");
  assert(defaultData.orchestration.provider === "deterministic", "seller agent default orchestration provider yanlış");
  assert(defaultData.orchestration.status === "fallback", "seller agent default orchestration status yanlış");
  assert(defaultData.runtime.role === "seller", "seller agent runtime role yanlış");
  assert(defaultData.runtime.promptTemplate.id === "seller-growth-route", "seller agent prompt registry id yanlış");
  assert(defaultData.runtime.toolPlan.some((tool) => tool.id === "seller.products.rank"), "seller agent products tool plan eksik");
  assert(defaultData.runtime.toolPlan.some((tool) => tool.requiresApproval), "seller agent approval tool plan eksik");
  assert(defaultData.runtime.handoff.nextMilestone === "8R", "seller agent runtime handoff 8R olmalı");
  validateAgentTrace("seller agent default", defaultData.agentTrace, {
    role: "seller",
    surface: "route",
    toolIds: [sellerAgentListingApplyToolId],
  });
  validateAgentTrace("seller agent slow movers", slowMoverData.agentTrace, {
    role: "seller",
    surface: "route",
    toolIds: [sellerAgentListingApplyToolId],
  });
  assert(defaultData.message.safetyNote.includes("Onay"), "seller agent safety note onay sınırı eksik");
  assert(slowMoverData.activeFocus === "slow-movers", "seller agent slow movers focus yanlış");
  assert(slowMoverData.orchestration.status === "fallback", "seller agent forced fallback orchestration status yanlış");
  assert(slowMoverData.orchestration.rankedProductIds[0] === slowMoverData.productFindings[0].product.id, "seller agent orchestration product ranking uyumsuz");
  assert(slowMoverData.orchestration.rankedActionIds[0] === slowMoverData.actionSuggestions[0].id, "seller agent orchestration action ranking uyumsuz");
  assert(
    slowMoverData.runtime.toolPlan.some((tool) => tool.id === "seller.profile.permissions"),
    "seller agent permission tool plan eksik",
  );
  assert(
    slowMoverData.runtime.toolPlan.some((tool) => tool.id === "seller.agent.listing.preview" && tool.requiresApproval),
    "seller agent preview approval tool plan eksik",
  );
  assert(
    slowMoverData.runtime.toolPlan.some((tool) => tool.id === sellerAgentListingApplyToolId && tool.requiresApproval),
    "seller agent apply approval tool plan eksik",
  );
  assert(slowMoverData.productFindings.length > 0, "seller agent product finding eksik");
  assert(slowMoverData.actionSuggestions.length > 0, "seller agent action suggestion eksik");
  assert(
    slowMoverData.productFindings.every((finding) => finding.product.image.src === "/catalog/buyer-product-sprite.png"),
    "seller agent ürün görsel sprite contract yanlış",
  );
  assert(
    slowMoverData.productFindings.every((finding) => finding.product.href.startsWith("/seller/products/")),
    "seller agent ürün href contract yanlış",
  );
  assert(
    slowMoverData.actionSuggestions.every((action) => action.href.startsWith("/seller/actions/")),
    "seller agent action href contract yanlış",
  );
  assert(
    slowMoverData.nextSteps.some((step) => step.requiresApproval),
    "seller agent approval boundary next step eksik",
  );
  assert(Boolean(slowMoverData.draftPreview?.requiresApproval), "seller agent draft preview onay gerektirmeli");
  assert(slowMoverData.draftPreview?.endpoint === sellerAgentApplyEndpoint, "seller agent draft endpoint yanlış");
  assert(slowMoverData.draftPreview?.toolId === sellerAgentListingApplyToolId, "seller agent draft apply tool id yanlış");
  assert(slowMoverData.draftPreview?.productId === slowMoverData.productFindings[0].product.id, "seller agent draft ürün id uyumsuz");
  assert(slowMoverData.draftPreview?.applyRequest.productId === slowMoverData.productFindings[0].product.id, "seller agent draft apply request ürün id yanlış");
  assert(slowMoverData.draftPreview?.delta.some((item) => item.field === "title"), "seller agent draft title delta eksik");
  assert(slowMoverData.draftPreview?.delta.some((item) => item.field === "price"), "seller agent draft price delta eksik");
  assert(
    slowMoverData.draftPreview?.sharedSurfaces.includes("route") &&
      slowMoverData.draftPreview?.sharedSurfaces.includes("floating"),
    "seller agent draft route/floating surface eksik",
  );
  assert(negativeReviewData.activeFocus === "negative-reviews", "seller agent negative review focus yanlış");
  assert(modelDrivenData.orchestration.status === "generated", "seller agent model override generated olmalı");
  assert(modelDrivenData.orchestration.rankedProductIds.includes(modelProduct.id), "seller agent LLM ranked product id eksik");
  assert(!modelDrivenData.orchestration.rankedProductIds.includes("invalid-product"), "seller agent LLM katalog dışı product id filtrelenmedi");
  assert(!modelDrivenData.orchestration.rankedActionIds.includes("invalid-action"), "seller agent LLM katalog dışı action id filtrelenmedi");
  assert(
    modelDrivenData.productFindings[0].reason.includes("LLM gerekçesi"),
    "seller agent LLM product reason uygulanmadı",
  );
  assert(
    modelDrivenData.actionSuggestions[0].expectedOutcome.includes("LLM action gerekçesi"),
    "seller agent LLM action reason uygulanmadı",
  );
  assert(
    modelDrivenData.draftPreview?.afterListing.title.includes("LLM hızlandırılmış"),
    "seller agent LLM draft title uygulanmadı",
  );
  assert(
    modelDrivenData.draftPreview?.applyRequest.mutation.title === modelDrivenData.draftPreview?.afterListing.title,
    "seller agent LLM draft apply request mutation uyumsuz",
  );
  assert(validRequest.ok, "seller agent valid request doğrulanmalı");
  assert(!missingPrompt.ok && missingPrompt.code === "PROMPT_REQUIRED", "seller agent missing prompt validation yanlış");
  assert(!longPrompt.ok && longPrompt.code === "PROMPT_TOO_LONG", "seller agent long prompt validation yanlış");
}

async function validateSellerListingMutationApplyContracts() {
  const agentData = await getSellerAgentApiData(
    {
      prompt: "Satılmayan ürünlerimi sırala ve ilk 3 sebebi açıkla.",
      sellerId: "seller-commercepilot",
    },
    { forceFallback: true },
  );
  const draftPreview = agentData.draftPreview;
  const invalidBody = validateSellerListingMutationApplyRequest(null);
  const missingProduct = validateSellerListingMutationApplyRequest({
    mutation: draftPreview?.afterListing,
  });
  const invalidMutation = validateSellerListingMutationApplyRequest({
    mutation: {
      campaignLabel: "x",
      description: "short",
      price: -1,
      title: "x",
    },
    productId: "prod-ergoflex-chair",
  });

  assert(Boolean(draftPreview), "seller listing apply için draft preview olmalı");

  if (!draftPreview) {
    return;
  }

  const validRequest = validateSellerListingMutationApplyRequest({
    ...draftPreview.applyRequest,
    actorId: "seller-commercepilot",
    sourceRuntimeId: agentData.runtime.runtimeId,
    surface: "route",
  });

  assert(validRequest.ok, "seller listing apply valid request doğrulanmalı");
  assert(!invalidBody.ok && invalidBody.code === "INVALID_BODY", "seller listing apply invalid body validation yanlış");
  assert(!missingProduct.ok && missingProduct.code === "PRODUCT_REQUIRED", "seller listing apply missing product validation yanlış");
  assert(!invalidMutation.ok && invalidMutation.code === "INVALID_MUTATION", "seller listing apply invalid mutation validation yanlış");

  const applyData = validRequest.ok ? getSellerListingMutationApplyApiData(validRequest.value) : undefined;

  assert(Boolean(applyData), "seller listing apply data üretilemedi");

  if (!applyData) {
    return;
  }

  assert(applyData.contract.endpoint === sellerAgentApplyEndpoint, "seller listing apply endpoint yanlış");
  assert(applyData.contract.method === "POST", "seller listing apply method yanlış");
  assert(applyData.sharedMutation.toolId === sellerAgentListingApplyToolId, "seller listing apply tool id yanlış");
  assert(applyData.sharedMutation.requiresApproval, "seller listing apply onay sınırı eksik");
  assert(applyData.sharedMutation.clientAction.helper === "applySellerListingMutation", "seller listing apply client helper yanlış");
  assert(applyData.sharedMutation.clientAction.rollbackHelper === "rollbackSellerListingMutation", "seller listing apply rollback helper yanlış");
  assert(applyData.sharedMutation.clientAction.eventName === sellerListingMutationUpdatedEvent, "seller listing apply storage event yanlış");
  assert(applyData.sharedMutation.stateTarget.storageKey === sellerListingMutationStorageKey, "seller listing apply storage key yanlış");
  assert(
    applyData.sharedMutation.sharedSurfaces.includes("route") &&
      applyData.sharedMutation.sharedSurfaces.includes("floating"),
    "seller listing apply route/floating surface eksik",
  );
  assert(applyData.auditPreview.rollbackAvailable, "seller listing apply rollback preview eksik");
  assert(applyData.delta.some((item) => item.field === "description"), "seller listing apply description delta eksik");
  assert(applyData.delta.some((item) => item.field === "campaignLabel"), "seller listing apply campaign delta eksik");
  assert(applyData.summary.fieldCount >= 4, "seller listing apply tüm temel alanları değiştirmeli");
}

function validateSharedAgentRuntimeContracts() {
  const runtime = getSharedAgentRuntimeApiData();
  const buyerSnapshot = createAgentRuntimeSnapshot({
    actorId: "buyer-aylin",
    prompt: "Toplantı için uyumlu kamera mikrofon hub öner.",
    role: "buyer",
  });
  const sellerSnapshot = createAgentRuntimeSnapshot({
    actorId: "seller-commercepilot",
    prompt: "Satılmayan ürünlerimi sırala.",
    role: "seller",
  });

  assert(runtime.contract.endpoint === "/api/agent/runtime", "shared runtime endpoint yanlış");
  assert(runtime.contract.envelope === "success/data/error", "shared runtime envelope yanlış");
  assert(runtime.summary.promptTemplateCount === agentPromptTemplates.length, "shared runtime prompt count uyumsuz");
  assert(runtime.summary.toolCount === agentToolRegistry.length, "shared runtime tool count uyumsuz");
  assert(runtime.routeSnapshots.length === 2, "shared runtime route snapshots eksik");
  assert(
    agentPromptTemplates.some((template) => template.id === "buyer-smart-cart-route") &&
      agentPromptTemplates.some((template) => template.id === "seller-growth-route"),
    "shared runtime buyer/seller prompt templates eksik",
  );
  assert(
    agentToolRegistry.some((tool) => tool.id === "buyer.agent.cart.apply.preview" && tool.requiresApproval),
    "shared runtime buyer apply approval tool eksik",
  );
  assert(
    agentToolRegistry.some((tool) => tool.id === "seller.agent.listing.preview" && tool.mutationKind === "preview" && tool.requiresApproval),
    "shared runtime seller preview tool eksik",
  );
  assert(
    agentToolRegistry.some((tool) => tool.id === sellerAgentListingApplyToolId && tool.mutationKind === "apply" && tool.requiresApproval),
    "shared runtime seller apply tool eksik",
  );
  assert(buyerSnapshot.request.routeContext === "/buyer/agent", "buyer runtime routeContext yanlış");
  assert(buyerSnapshot.promptTemplate.id === "buyer-smart-cart-route", "buyer runtime prompt id yanlış");
  assert(buyerSnapshot.promptTemplate.version === "8Q.1", "buyer runtime prompt version 8Q.1 olmalı");
  assert(buyerSnapshot.toolPlan.some((tool) => tool.id === "buyer.catalog.search"), "buyer runtime catalog tool eksik");
  assert(
    buyerSnapshot.toolPlan.some((tool) => tool.id === "buyer.agent.cart.apply.preview" && tool.requiresApproval),
    "buyer runtime apply approval tool eksik",
  );
  assert(buyerSnapshot.handoff.nextMilestone === "8R", "buyer runtime handoff 8R olmalı");
  assert(sellerSnapshot.request.routeContext === "/seller/agent", "seller runtime routeContext yanlış");
  assert(sellerSnapshot.promptTemplate.id === "seller-growth-route", "seller runtime prompt id yanlış");
  assert(sellerSnapshot.promptTemplate.version === "8Q.1", "seller runtime prompt version 8Q.1 olmalı");
  assert(sellerSnapshot.toolPlan.some((tool) => tool.id === "seller.profile.permissions"), "seller runtime permission tool eksik");
  assert(
    sellerSnapshot.toolPlan.some((tool) => tool.id === sellerAgentListingApplyToolId && tool.requiresApproval),
    "seller runtime apply approval tool eksik",
  );
  assert(sellerSnapshot.handoff.nextMilestone === "8R", "seller runtime handoff 8R olmalı");
}

function validateFloatingAgentContracts() {
  const buyerContext = createFloatingAgentContext({
    pathname: "/buyer/cart",
    role: "buyer",
  });
  const sellerContext = createFloatingAgentContext({
    pathname: "/seller/products",
    role: "seller",
  });
  const buyerProductWarningContext = createFloatingAgentContext({
    pathname: "/buyer/products/ergoflex-calisma-sandalyesi",
    role: "buyer",
  });
  const normalizedPath = normalizeFloatingAgentPathname("/seller/products/");
  const defaultStore = createDefaultFloatingAgentStore();
  const profileProductAlert = getBuyerProductProfileAlert({
    pathname: "/buyer/products/ergoflex-calisma-sandalyesi",
  });

  assert(floatingAgentStorageKey === "commercepilot.floatingAgent.v1", "floating agent storage key yanlış");
  assert(floatingAgentUpdatedEvent === "commercepilot:floating-agent-updated", "floating agent event yanlış");
  assert(normalizedPath === "/seller/products", "floating agent pathname normalize yanlış");
  assert(defaultStore.version === 1, "floating agent store version yanlış");
  assert(!defaultStore.control.muted, "floating agent default mute kapalı olmalı");
  assert(defaultStore.control.disabledRoutes.length === 0, "floating agent default disabled routes boş olmalı");
  assert(defaultStore.history.length === 0, "floating agent default history boş olmalı");
  assert(buyerContext.role === "buyer", "floating buyer role yanlış");
  assert(buyerContext.routeLabel === "Buyer sepet", "floating buyer route label yanlış");
  assert(buyerContext.runtime.surface === "floating", "floating buyer runtime surface yanlış");
  assert(buyerContext.runtime.request.routeContext === "/buyer/cart", "floating buyer route context yanlış");
  assert(buyerContext.runtime.runtimeId === "buyer-floating-8q", "floating buyer runtime id yanlış");
  assert(buyerContext.runtime.handoff.nextMilestone === "8R", "floating buyer handoff 8R olmalı");
  validateAgentTrace("floating buyer", buyerContext.agentTrace, {
    role: "buyer",
    surface: "floating",
    toolIds: ["buyer.agent.cart.apply.preview"],
  });
  assert(
    buyerContext.capabilities.some((capability) => capability.id === "buyer-cart-apply" && capability.requiresApproval),
    "floating buyer cart apply capability eksik",
  );
  assert(
    buyerContext.controls.some((control) => control.id === "mute") &&
      buyerContext.controls.some((control) => control.id === "snooze-page"),
    "floating buyer controls eksik",
  );
  assert(profileProductAlert?.title.toLocaleLowerCase("tr-TR").includes("kargo"), "buyer product profile alert kargo uyarısı üretmeli");
  assert(
    buyerProductWarningContext.proactiveTone === "warning" &&
      buyerProductWarningContext.profileAlert?.productId === "prod-ergoflex-calisma-sandalyesi" &&
      buyerProductWarningContext.proactiveMessage.includes("hızlı teslimat"),
    "floating buyer ürün detayında profil/yorum uyarısı proactive mesaja taşınmalı",
  );
  assert(sellerContext.role === "seller", "floating seller role yanlış");
  assert(sellerContext.routeLabel === "Seller ürünler", "floating seller route label yanlış");
  assert(sellerContext.runtime.surface === "floating", "floating seller runtime surface yanlış");
  assert(sellerContext.runtime.request.routeContext === "/seller/products", "floating seller route context yanlış");
  assert(sellerContext.runtime.runtimeId === "seller-floating-8q", "floating seller runtime id yanlış");
  assert(sellerContext.runtime.handoff.nextMilestone === "8R", "floating seller handoff 8R olmalı");
  validateAgentTrace("floating seller", sellerContext.agentTrace, {
    role: "seller",
    surface: "floating",
    toolIds: [sellerAgentListingApplyToolId],
  });
  assert(
    sellerContext.capabilities.some((capability) => capability.id === "seller-listing-apply" && capability.requiresApproval),
    "floating seller listing apply capability eksik",
  );
  assert(
    sellerContext.sharedMutationNotes.some((note) => note.includes("audit")),
    "floating seller audit shared mutation notu eksik",
  );
}

async function validateFloatingAgentApiContracts() {
  const invalid = validateFloatingAgentRequest({
    pathname: "/buyer/products",
    prompt: "x",
    role: "buyer",
  });
  const valid = validateFloatingAgentRequest({
    actorId: "buyer-aylin",
    history: [
      {
        content: "Bu agent ne yapıyor?",
        role: "user",
      },
    ],
    pathname: "/buyer/products/",
    prompt: "Sepetim otomatik değişir mi?",
    role: "buyer",
  });
  const buyerChat = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [],
      pathname: "/buyer/products",
      prompt: "Sepetim otomatik değişir mi?",
      role: "buyer",
    },
    { forceFallback: true },
  );
  const buyerAction = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [],
      pathname: "/buyer/products",
      prompt: "Anneme 1000 TL altında hızlı teslim hediye öner.",
      role: "buyer",
    },
    { forceFallback: true },
  );
  const sellerAction = await getFloatingAgentApiData(
    {
      actorId: "seller-commercepilot",
      history: [],
      pathname: "/seller/products",
      prompt: "Satılmayan ürünleri sırala ve listing taslağı hazırla.",
      role: "seller",
    },
    { forceFallback: true },
  );
  const outOfScope = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [],
      pathname: "/buyer/products",
      prompt: "Bugün hava nasıl?",
      role: "buyer",
    },
    { forceFallback: true },
  );
  const modelRoutedChat = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [],
      pathname: "/buyer/products",
      prompt: "Bu panel ne işe yarıyor?",
      role: "buyer",
    },
    {
      modelTextOverride: JSON.stringify({
        answer: "Bu panel alışveriş içinde kısa cevap verir; aksiyon gerekirse öneriyi onaya taşır.",
        confidence: 0.91,
        mode: "chat",
        reason: "Kullanıcı ürün içi yardım soruyor.",
      }),
    },
  );
  const modelMisroutedBuyerAction = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [
        {
          content: "Sepetim otomatik değişir mi?",
          role: "user",
        },
        {
          content: "Hayır. Onay vermeden sepetini değiştirmem.",
          role: "assistant",
        },
      ],
      pathname: "/buyer/products",
      prompt: "Anneme 1000 TL altında hızlı teslim hediye öner.",
      role: "buyer",
    },
    {
      modelTextOverride: JSON.stringify({
        answer: "Hayır, sepet otomatik değişmez.",
        confidence: 0.71,
        mode: "chat",
        reason: "Model geçmişteki güvenlik sorusuna takıldı.",
      }),
    },
  );
  const unsupportedBuyerCatalogPrompt = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [],
      pathname: "/buyer/products",
      prompt: "2000 TL altında iPhone önerir misin?",
      role: "buyer",
    },
    { forceFallback: true },
  );
  const unsupportedConsolePrompt = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [],
      pathname: "/buyer/products",
      prompt: "PlayStation 5 ve oyun kolu sepete hazırla.",
      role: "buyer",
    },
    { forceFallback: true },
  );
  const buyerRoleSellerPrompt = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [],
      pathname: "/buyer/products",
      prompt: "Satılmayan ürünlerimi sırala ve stok riskini açıkla.",
      role: "buyer",
    },
    { forceFallback: true },
  );
  const sellerRoleBuyerPrompt = await getFloatingAgentApiData(
    {
      actorId: "seller-commercepilot",
      history: [],
      pathname: "/seller",
      prompt: "Anneme hızlı teslim hediye öner ve sepete ekle.",
      role: "seller",
    },
    { forceFallback: true },
  );
  const staleModelActionPrompt = await getFloatingAgentApiData(
    {
      actorId: "buyer-aylin",
      history: [
        {
          content: "Toplantı için kamera mikrofon öner.",
          role: "user",
        },
      ],
      pathname: "/buyer/products",
      prompt: "2000 TL altı mevcut ürünleri sıralar mısın?",
      role: "buyer",
    },
    {
      modelTextOverride: JSON.stringify({
        actionPrompt: "Toplantı için kamera mikrofon öner.",
        answer: "Önceki toplantı materyallerini sıralıyorum.",
        confidence: 0.86,
        mode: "buyer-agent",
        reason: "Model geçmiş komuta takıldı.",
      }),
    },
  );

  assert(!invalid.ok && invalid.code === "PROMPT_TOO_SHORT", "floating agent kısa prompt validation yanlış");
  assert(valid.ok && valid.value.pathname === "/buyer/products", "floating agent request normalize yanlış");
  assert(floatingAgentEndpoint === "/api/agent/floating", "floating agent endpoint yanlış");
  assert(buyerChat.contract.endpoint === floatingAgentEndpoint, "floating agent contract endpoint yanlış");
  assert(buyerChat.decision.mode === "chat", "floating buyer help sorusu chat mode dönmeli");
  assert(!buyerChat.buyerAgent, "floating buyer chat sorusu agentic öneri üretmemeli");
  assert(
    buyerChat.message.content.toLocaleLowerCase("tr-TR").includes("onay"),
    "floating buyer chat cevabı onay sınırını anlatmalı",
  );
  assert(buyerAction.decision.mode === "buyer-agent", "floating buyer action buyer-agent mode dönmeli");
  assert(Boolean(buyerAction.buyerAgent), "floating buyer action buyerAgent data üretmeli");
  assert(!buyerAction.sellerAgent, "floating buyer action sellerAgent üretmemeli");
  assert(buyerAction.decision.actionPrompt?.includes("Anneme"), "floating buyer action prompt korunmalı");
  assert(sellerAction.decision.mode === "seller-agent", "floating seller action seller-agent mode dönmeli");
  assert(Boolean(sellerAction.sellerAgent), "floating seller action sellerAgent data üretmeli");
  assert(!sellerAction.buyerAgent, "floating seller action buyerAgent üretmemeli");
  assert(outOfScope.decision.mode === "chat", "floating out-of-scope soru chat boundary dönmeli");
  assert(
    outOfScope.message.content.includes("CommercePilot"),
    "floating out-of-scope cevabı commerce sınırını belirtmeli",
  );
  assert(modelRoutedChat.orchestration.status === "generated", "floating model override generated olmalı");
  assert(modelRoutedChat.decision.mode === "chat", "floating model override chat mode korunmalı");
  assert(
    modelMisroutedBuyerAction.decision.mode === "buyer-agent" && Boolean(modelMisroutedBuyerAction.buyerAgent),
    "floating current prompt explicit action ise history kaynaklı chat misroute override edilmeli",
  );
  assert(
    unsupportedBuyerCatalogPrompt.decision.mode === "chat" &&
      !unsupportedBuyerCatalogPrompt.buyerAgent &&
      unsupportedBuyerCatalogPrompt.message.content.includes("kataloğunda yok"),
    "floating katalog dışı buyer ürün prompt'u eski/uydurma öneri üretmemeli",
  );
  assert(
    unsupportedConsolePrompt.decision.mode === "chat" &&
      !unsupportedConsolePrompt.buyerAgent &&
      unsupportedConsolePrompt.message.content.includes("PlayStation"),
    "floating PlayStation gibi katalog dışı ürün prompt'u öneri/apply üretmemeli",
  );
  assert(
    buyerRoleSellerPrompt.decision.mode === "chat" &&
      !buyerRoleSellerPrompt.buyerAgent &&
      buyerRoleSellerPrompt.message.content.includes("satıcı operasyonu"),
    "floating buyer rolünde seller-only komut buyer-agent mode'a düşmemeli",
  );
  assert(
    sellerRoleBuyerPrompt.decision.mode === "chat" &&
      !sellerRoleBuyerPrompt.sellerAgent &&
      sellerRoleBuyerPrompt.message.content.includes("alıcı sepeti"),
    "floating seller rolünde buyer-only komut seller-agent mode'a düşmemeli",
  );
  assert(
    staleModelActionPrompt.decision.mode === "buyer-agent" &&
      staleModelActionPrompt.decision.actionPrompt === "2000 TL altı mevcut ürünleri sıralar mısın?",
    "floating current prompt action ise modelin eski actionPrompt'u kullanılmamalı",
  );
}

function validateDemoRehearsalContracts() {
  const demo = getDemoRehearsalData();
  const laneIds = new Set(demo.runbook.map((lane) => lane.id));
  const qaIds = new Set(demo.qaChecks.map((check) => check.id));
  const llmProofIds = new Set(demo.llmProofs.map((proof) => proof.id));
  const agentTraceProofIds = new Set(demo.agentTraceProofs.map((proof) => proof.id));

  assert(demoRehearsalRoute === "/demo", "demo rehearsal route yanlış");
  assert(demo.milestone === "8R", "demo milestone 8R olmalı");
  assert(demo.nextMilestone === "9A", "demo next milestone 9A olmalı");
  assert(demo.headline.includes("Demo akışı"), "demo headline eksik");
  assert(demo.ctas.buyer === "/buyer/products", "demo buyer CTA yanlış");
  assert(demo.ctas.seller === "/seller", "demo seller CTA yanlış");
  assert(demo.ctas.qa === "/demo#qa", "demo QA CTA yanlış");
  assert(demo.runbook.length === 3, "demo runbook üç lane olmalı");
  assert(laneIds.has("buyer") && laneIds.has("seller") && laneIds.has("floating"), "demo runbook lane eksik");
  demo.runbook.forEach((lane) => {
    assert(lane.steps.length === 3, `${lane.id}: demo lane üç adım olmalı`);
    lane.steps.forEach((step) => {
      assert(step.href.startsWith("/"), `${step.id}: demo href route olmalı`);
      assert(step.command.length > 12, `${step.id}: demo command kısa`);
      assert(step.expected.length > 18, `${step.id}: demo expected kısa`);
    });
  });
  assert(demo.proofCards.length === 3, "demo proof card üç adet olmalı");
  assert(demo.qaChecks.length >= 5, "demo QA checklist eksik");
  assert(
    qaIds.has("qa-check") &&
      qaIds.has("qa-build") &&
      qaIds.has("qa-runtime") &&
      qaIds.has("qa-browser") &&
      qaIds.has("qa-llm-trace"),
    "demo QA id eksik",
  );
  assert(demo.qaChecks.some((check) => check.command === "npm run check"), "demo npm run check kanıtı eksik");
  assert(demo.qaChecks.some((check) => check.command === "npm run build"), "demo npm run build kanıtı eksik");
  assert(demo.marquee.some((item) => item.includes("Runtime 8Q.1")), "demo runtime marquee eksik");
  assert(demo.marquee.some((item) => item.includes("LLM trace")), "demo LLM trace marquee eksik");
  assert(demo.llmProofs.length >= 5, "demo LLM proof listesi eksik");
  assert(demo.agentTraceProofs.length >= 3, "demo agent trace proof listesi eksik");
  assert(
    agentTraceProofIds.has("buyer-agent-execution-trace") &&
      agentTraceProofIds.has("seller-agent-execution-trace") &&
      agentTraceProofIds.has("floating-agent-execution-trace"),
    "demo agent trace proof id eksik",
  );
  assert(
    llmProofIds.has("buyer-agent-llm") &&
      llmProofIds.has("seller-agent-llm") &&
      llmProofIds.has("buyer-explanation-llm") &&
      llmProofIds.has("seller-explanation-llm") &&
      llmProofIds.has("review-intelligence-llm"),
    "demo LLM proof id eksik",
  );
  demo.llmProofs.forEach((proof) => {
    assert(proof.route.startsWith("/") && proof.endpoint.length > 8, `${proof.id}: LLM proof route/endpoint eksik`);
    assert(proof.fields.some((field) => field.endsWith(".status")), `${proof.id}: status field eksik`);
    assert(proof.fields.some((field) => field.endsWith(".provider")), `${proof.id}: provider field eksik`);
    assert(proof.fields.some((field) => field.endsWith(".model")), `${proof.id}: model field eksik`);
    assert(proof.fields.some((field) => field.endsWith(".fallbackReason")), `${proof.id}: fallbackReason field eksik`);
  });
  demo.agentTraceProofs.forEach((proof) => {
    assert(proof.route.startsWith("/") && proof.endpoint.length > 8, `${proof.id}: agent trace route/endpoint eksik`);
    ["context", "workflow", "llm", "guardrail", "approval", "tool"].forEach((layer) => {
      assert(proof.requiredLayers.includes(layer), `${proof.id}: ${layer} layer proof eksik`);
    });
    assert(proof.expectedToolIds.length > 0, `${proof.id}: expected tool id eksik`);
    assert(proof.status === "contracted", `${proof.id}: trace proof status yanlış`);
  });
}

function validateSellerProfileApiContracts() {
  const defaultData = getDefaultSellerProfileApiData();
  const missingSellerData = getSellerProfileApiData({ sellerId: "missing-seller" });
  const validPatch = validateSellerProfilePatchRequest({
    alertRules: defaultData.editable.alertRules.map((rule) => (
      rule.id === "stock-risk" ? { ...rule, threshold: "critical" } : rule
    )),
    defaultDeliveryPromiseDays: 2,
    enabledCapabilityIds: ["product-analysis", "listing-draft", "price-suggestion", "auto-apply"],
    notificationChannelIds: ["panel", "email", "panel"],
    permissionMode: "approved-apply",
    proactiveControls: {
      disableOnProductPages: true,
      floatingBadgeEnabled: true,
      hideFloatingAgent: false,
      muteAll: false,
    },
    quietHours: {
      end: "08:30",
      start: "23:00",
    },
    returnWindowDays: 21,
    sellerId: "seller-commercepilot",
    storeDisplayName: "CommercePilot Store",
    supportResponseHours: 3,
  });
  const longNamePatch = validateSellerProfilePatchRequest({
    sellerId: "seller-commercepilot",
    storeDisplayName: "x".repeat(73),
  });
  const missingSellerPatch = validateSellerProfilePatchRequest({
    sellerId: "missing-seller",
    storeDisplayName: "CommercePilot Store",
  });
  const chatOnlyPatch = validateSellerProfilePatchRequest({
    enabledCapabilityIds: ["product-analysis", "listing-draft", "stock-alert"],
    permissionMode: "chat-only",
    sellerId: "seller-commercepilot",
    storeDisplayName: "CommercePilot Store",
  });
  const patchedData = validPatch.ok
    ? getSellerProfileApiData({
        editableOverride: validPatch.value,
        method: "PATCH",
        sellerId: validPatch.value.sellerId,
      })
    : undefined;

  assert(defaultData.contract.envelope === "success/data/error", "seller profile envelope contract yanlış");
  assert(defaultData.contract.endpoint === "/api/seller/profile", "seller profile endpoint yanlış");
  assert(defaultData.contract.method === "GET", "seller profile method yanlış");
  assert(defaultData.seller.id === "seller-commercepilot", "seller profile default seller yanlış");
  assert(defaultData.permissionModes.length === 3, "seller profile permission mode sayısı yanlış");
  assert(defaultData.editable.permissionMode === "draft-only", "seller profile default permission mode yanlış");
  assert(defaultData.capabilities.some((capability) => capability.id === "auto-apply" && capability.locked), "seller profile auto-apply kilidi eksik");
  assert(!defaultData.summary.autoApplyAllowed, "seller profile auto apply default kapalı olmalı");
  assert(defaultData.notificationChannels.length >= 4, "seller profile notification channel sayısı yetersiz");
  assert(defaultData.editable.alertRules.length === 4, "seller profile alert rule sayısı yanlış");
  assert(defaultData.auditTrail.some((item) => item.actorName === "CommercePilot Agent"), "seller profile audit Agent izi eksik");
  assert(defaultData.agentPreview.appliedRules.length >= 3, "seller profile agent preview kuralları eksik");
  assert(!missingSellerData, "olmayan seller profile undefined dönmeli");
  assert(validPatch.ok, "seller profile valid PATCH reddedildi");

  if (validPatch.ok) {
    assert(validPatch.value.permissionMode === "approved-apply", "seller profile PATCH permission mode yanlış");
    assert(!validPatch.value.enabledCapabilityIds.includes("auto-apply"), "seller profile locked auto apply filtrelenmeli");
    assert(validPatch.value.notificationChannelIds.length === 2, "seller profile channel unique normalize yanlış");
    assert(validPatch.value.quietHours.start === "23:00", "seller profile quiet hours normalize yanlış");
  }

  assert(!longNamePatch.ok && longNamePatch.code === "STORE_NAME_TOO_LONG", "seller profile uzun mağaza adı validation yanlış");
  assert(!missingSellerPatch.ok && missingSellerPatch.code === "SELLER_NOT_FOUND", "seller profile missing seller validation yanlış");
  assert(chatOnlyPatch.ok, "seller profile chat-only PATCH reddedilmemeli");

  if (chatOnlyPatch.ok) {
    assert(!chatOnlyPatch.value.enabledCapabilityIds.includes("listing-draft"), "seller profile chat-only draft yetkisini filtrelemeli");
  }

  assert(Boolean(patchedData), "seller profile PATCH data üretilemedi");

  if (patchedData) {
    assert(patchedData.contract.method === "PATCH", "seller profile PATCH method contract yanlış");
    assert(patchedData.summary.permissionLabel === "Onaylı uygulama", "seller profile PATCH permission label yanlış");
    assert(
      patchedData.policyPreview.rules.some((rule) => rule.includes("Otomatik uygulama")),
      "seller profile policy preview auto apply sınırını taşımıyor",
    );
  }
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
  assert(explanation.source.reviewIntelligenceProductCount > 0, "buyer explanation review intelligence enrichment eksik");

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

function validateAgentTrace(label, trace, options) {
  const requiredLayers = ["context", "workflow", "llm", "guardrail", "approval", "tool"];

  assert(Boolean(trace), `${label}: agent trace eksik`);

  if (!trace) {
    return;
  }

  assert(trace.role === options.role, `${label}: trace role yanlış`);
  assert(trace.surface === options.surface, `${label}: trace surface yanlış`);
  assert(typeof trace.id === "string" && trace.id.includes("execution-trace"), `${label}: trace id yanlış`);
  assert(typeof trace.summary === "string" && trace.summary.length > 24, `${label}: trace summary zayıf`);
  assert(Array.isArray(trace.items) && trace.items.length >= requiredLayers.length, `${label}: trace item coverage zayıf`);
  assert(Boolean(trace.generatedAt), `${label}: trace generatedAt eksik`);

  trace.items.forEach((item, index) => {
    assert(item.order === index + 1, `${label}: trace order ${item.id} yanlış`);
    assert(typeof item.label === "string" && item.label.length > 4, `${label}: trace label eksik`);
    assert(typeof item.detail === "string" && item.detail.length > 16, `${label}: trace detail zayıf`);
  });

  requiredLayers.forEach((layer) => {
    assert(trace.coverage?.[layer] === true, `${label}: trace ${layer} coverage eksik`);
    assert(trace.items.some((item) => item.layer === layer), `${label}: trace ${layer} item eksik`);
  });

  options.toolIds.forEach((toolId) => {
    assert(trace.items.some((item) => item.toolId === toolId), `${label}: trace tool id ${toolId} eksik`);
  });

  assert(
    trace.items.some((item) => item.layer === "approval" && item.requiresApproval),
    `${label}: trace approval boundary eksik`,
  );
}

function validateAgentTraceUiContracts() {
  const componentSource = readProjectFile("src/components/commerce/agent-execution-trace-panel.tsx");
  const buyerSource = readProjectFile("src/components/commerce/buyer-agent-workspace.tsx");
  const buyerCatalogSource = readProjectFile("src/components/commerce/buyer-catalog-grid.tsx");
  const buyerProfileSource = readProjectFile("src/components/commerce/buyer-profile-workspace.tsx");
  const sellerSource = readProjectFile("src/components/commerce/seller-agent-workspace.tsx");
  const floatingSource = readProjectFile("src/components/commerce/floating-agent-panel.tsx");
  const demoSource = readProjectFile("src/components/commerce/demo-rehearsal-workspace.tsx");
  const requiredLayers = ["context", "workflow", "llm", "guardrail", "approval", "tool"];

  assert(componentSource.includes("export function AgentExecutionTracePanel"), "agent trace panel component export eksik");
  assert(componentSource.includes("grid-flow-dense"), "agent trace panel coverage grid dense değil");
  requiredLayers.forEach((layer) => {
    assert(componentSource.includes(layer), `agent trace panel ${layer} layer görünürlüğü eksik`);
  });

  assert(!buyerSource.includes("AgentExecutionTracePanel"), "buyer agent kullanıcı ekranında teknik trace görünmemeli");
  assert(buyerSource.includes("BuyerAgentFaq"), "buyer agent açıklanabilirlik SSS alanı eksik");
  assert(
    buyerCatalogSource.includes("snap-x snap-mandatory") && !buyerCatalogSource.includes("gsap.from"),
    "buyer catalog yatay slider sadeleşmesi eksik",
  );
  assert(
    buyerProfileSource.includes("reviewsPerPage = 5") && buyerProfileSource.includes("visibleReviews.map"),
    "buyer profile 5'li yorum sayfalaması eksik",
  );
  assert(
    sellerSource.includes("AgentExecutionTracePanel") && sellerSource.includes("trace={data.agentTrace}"),
    "seller agent trace panel UI bağlanmadı",
  );
  assert(
    !floatingSource.includes("AgentExecutionTracePanel") &&
      !floatingSource.includes("LlmStatusBadge") &&
      floatingSource.includes("Nasıl yardımcı olayım?") &&
      floatingSource.includes("placeholder={context.defaultPrompt}") &&
      floatingSource.includes('setPromptDraft({ contextKey, value: "" })') &&
      floatingSource.includes("history: []") &&
      floatingSource.includes("openFreshSession") &&
      !floatingSource.includes("appendFloatingAgentTurn"),
    "floating agent kullanıcı chatbot yüzeyine sadeleşmedi",
  );
  assert(
    demoSource.includes("data.agentTraceProofs.map") && demoSource.includes("AgentTraceProofCard"),
    "demo agent trace proof UI bağlanmadı",
  );
}

function validateAgentComponentExtractionContracts() {
  const buyerWorkspaceSource = readProjectFile("src/components/commerce/buyer-agent-workspace.tsx");
  const buyerPanelsSource = readProjectFile("src/components/commerce/buyer-agent-panels.tsx");
  const sellerWorkspaceSource = readProjectFile("src/components/commerce/seller-agent-workspace.tsx");
  const sellerListingPanelsSource = readProjectFile("src/components/commerce/seller-agent-listing-panels.tsx");
  const floatingSource = readProjectFile("src/components/commerce/floating-agent-panel.tsx");
  const floatingResultSource = readProjectFile("src/components/commerce/floating-agent-result-panel.tsx");

  [
    "BuyerAgentConversationPanel",
    "BuyerRecommendationCard",
    "BuyerAgentApplyPanel",
    "BuyerAgentFaq",
    "BuyerRecommendationSkeleton",
    "BuyerAgentEmptyPanel",
  ].forEach((componentName) => {
    assert(buyerPanelsSource.includes(`export function ${componentName}`), `buyer agent panel export eksik: ${componentName}`);
    assert(buyerWorkspaceSource.includes(componentName), `buyer workspace component import/kullanım eksik: ${componentName}`);
  });

  [
    "ListingSnapshot",
    "ListingMutationApprovalPanel",
  ].forEach((componentName) => {
    assert(
      sellerListingPanelsSource.includes(`export function ${componentName}`),
      `seller listing panel export eksik: ${componentName}`,
    );
    assert(sellerWorkspaceSource.includes(componentName), `seller workspace component import/kullanım eksik: ${componentName}`);
  });

  assert(
    floatingResultSource.includes("export function FloatingResultPanel") && floatingSource.includes("FloatingResultPanel"),
    "floating result panel extraction contract eksik",
  );
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
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
