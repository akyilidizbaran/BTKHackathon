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
  getSellerActionsApiData,
  getSellerOverviewApiData,
  getSellerProductHealthApiData,
  getSellerProductsApiData,
} = require("../src/lib/api/seller");
const {
  buyerSmartCartExamples,
  getBuyerSmartCartApiData,
  getDefaultBuyerSmartCartApiData,
  validateBuyerSmartCartRequest,
} = require("../src/lib/api/buyer");

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

validateMockDataIntegrity();
validateScoringLayer();
validateSellerWorkflows();
validateSellerApiContracts();
validateBuyerWorkflows();
validateBuyerApiContracts();

if (failures.length > 0) {
  console.error("Workflow validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  [
    "Workflow validation passed.",
    `Products: ${products.length}`,
    `Reviews: ${reviews.length}`,
    `Seller actions: ${generateSellerActionsWorkflow("seller-commercepilot")?.actions.length ?? 0}`,
    `Seller API products: ${getSellerProductsApiData("seller-commercepilot")?.products.length ?? 0}`,
    `Buyer API examples: ${buyerSmartCartExamples.length}`,
    "Buyer prompts: 7",
  ].join("\n"),
);

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
  const productContract = getSellerProductsApiData(sellerId);
  const keyProHealth = getSellerProductHealthApiData("prod-keypro-mekanik-klavye");

  assert(Boolean(overview), "seller overview API contract üretilemedi");
  assert(Boolean(actions), "seller actions API contract üretilemedi");
  assert(Boolean(productContract), "seller products API contract üretilemedi");
  assert(Boolean(keyProHealth), "seller product health API contract üretilemedi");

  if (overview) {
    assert(overview.contract.envelope === "success/data/error", "overview envelope contract yanlış");
    assert(overview.stats.analyzedProductCount === products.length, "overview analyzedProductCount yanlış");
    assert(overview.topActions.length === 5, "overview top actions top 5 dönmeli");
    assert(overview.operationSignals.length > 0, "overview operation signals boş");
  }

  if (actions) {
    assert(actions.contract.envelope === "success/data/error", "actions envelope contract yanlış");
    assert(actions.actions.length === 5, "actions API top 5 dönmeli");
    assert(actions.actionTypeCoverage.includes("restock"), "actions API restock coverage eksik");
  }

  if (productContract) {
    assert(productContract.contract.envelope === "success/data/error", "products envelope contract yanlış");
    assert(productContract.products.length === products.length, "products API ürün sayısı yanlış");
    assert(productContract.summary.averageHealthScore > 0, "products API ortalama sağlık skoru eksik");
    assert(productContract.products.every((product) => product.href.startsWith("/seller/products/")), "products API href contract yanlış");
    assert(
      productContract.products.every((product) => product.apiHealthEndpoint.startsWith("/api/seller/products/")),
      "products API health endpoint contract yanlış",
    );
  }

  if (keyProHealth) {
    assert(keyProHealth.product.slug === "keypro-mekanik-klavye", "KeyPro product slug contract yanlış");
    assert(keyProHealth.product.apiHealthEndpoint === "/api/seller/products/prod-keypro-mekanik-klavye/health", "KeyPro health endpoint yanlış");
    assert(keyProHealth.topInsights.length === 3, "KeyPro health API top 3 insight dönmeli");
    assert(keyProHealth.evidenceSnapshot.length >= 4, "KeyPro health evidence snapshot eksik");
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
