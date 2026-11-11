import test from "node:test";
import assert from "node:assert/strict";
import { listPublishedServices } from "../src/_webapp-mirror/api/catalogListing.js";
import { fastestDeliveryDays, toPackages, toServiceCard, toServiceDetail } from "../src/_webapp-mirror/api/adapters.js";
import {
  applyMediaOp,
  attachGalleryIds,
  defaultPackages,
  planMediaChanges,
  toPackageBody,
} from "../src/_webapp-mirror/pages/ServiceForm/serviceFormSync.js";
import { countByRootCategory } from "../src/_webapp-mirror/api/catalogListing.js";
import { validatePackagePrices } from "../src/_webapp-mirror/pages/ServiceForm/formValidation.js";

const page = (data) => ({ result: { data } });

test("listPublishedServices sends all four filters per category × type and dedupes", async () => {
  const calls = [];
  const api = {
    getRootCategories: async () =>
      page([{ categoryId: "r1", children: [{ categoryId: "c1" }] }]),
    listServices: async (params) => {
      calls.push(params);
      if (params.executionType === "ONSITE") return page([{ serviceId: "s1" }]);
      if (params.categoryId === "c1") throw new Error("boom");
      return page([{ serviceId: "s1" }, { serviceId: "s2" }]);
    },
  };
  const { services, categories } = await listPublishedServices({ api });
  assert.deepEqual(services.map((s) => s.serviceId).sort(), ["s1", "s2"]);
  assert.deepEqual(categories.map((c) => c.categoryId), ["r1", "c1"]);
  assert.equal(calls.length, 4);
  for (const c of calls) {
    assert.ok(c.categoryId && c.executionType, "categoryId and executionType are required by the API");
    assert.equal(c.minPrice, 0);
    assert.ok(c.maxPrice > 0);
  }
});

test("listPublishedServices can be limited to ONSITE services", async () => {
  const types = [];
  const api = {
    getRootCategories: async () => page([{ categoryId: "r1" }]),
    listServices: async (p) => (types.push(p.executionType), page([])),
  };
  await listPublishedServices({ api, executionTypes: ["ONSITE"] });
  assert.deepEqual(types, ["ONSITE"]);
});

test("fastestDeliveryDays ignores inactive and ONSITE (0 / null) packages", () => {
  assert.equal(
    fastestDeliveryDays([
      { deliveryDay: 5, packageStatus: "ACTIVE" },
      { deliveryDay: 2, packageStatus: "INACTIVE" },
      { deliveryDay: 3 },
    ]),
    3
  );
  assert.equal(fastestDeliveryDays([{ deliveryDay: 0, durationMinute: 60 }]), null);
  assert.equal(fastestDeliveryDays([]), null);
});

test("toServiceCard fills deliveryDays only when packages are given", () => {
  const dto = { serviceId: "s1", title: "Logo" };
  assert.equal(toServiceCard(dto).deliveryDays, null);
  assert.equal(toServiceCard(dto, { packages: [{ deliveryDay: 4 }, { deliveryDay: 7 }] }).deliveryDays, 4);
});

test("toPackages breaks price ties by creation order", () => {
  const pkgs = toPackages([
    { packageId: "late", price: 100, createdAt: "2026-11-10T10:00:02Z" },
    { packageId: "early", price: 100, createdAt: "2026-11-10T10:00:01Z" },
  ]);
  assert.deepEqual(pkgs.map((p) => [p.id, p.tier]), [["early", "BASIC"], ["late", "STANDARD"]]);
});

test("toPackageBody sends delivery days for DIGITAL and minutes for ONSITE", () => {
  const pkg = { title: " Gói <b>A</b> ", desc: "Mô tả", price: 300000, days: 3, minutes: 90, rev: "2 lần" };
  assert.deepEqual(toPackageBody(pkg, "DIGITAL", "basic"), {
    name: "Gói A",
    description: "Mô tả",
    price: 300000,
    currency: "VND",
    deliveryDay: 3,
    durationMinute: null,
    revisionLimit: 2,
  });
  const onsite = toPackageBody(pkg, "ONSITE", "basic");
  assert.equal(onsite.deliveryDay, null);
  assert.equal(onsite.durationMinute, 90);
  assert.equal(toPackageBody({ ...pkg, minutes: undefined }, "ONSITE", "premium").durationMinute, 240);
  assert.equal(toPackageBody({ ...pkg, rev: "Không giới hạn" }, "DIGITAL", "basic").revisionLimit, null);
});

test("validatePackagePrices checks every package and needs strictly rising prices", () => {
  const pk = (b, s, p) => ({ basic: { price: b }, standard: { price: s }, premium: { price: p } });
  assert.equal(validatePackagePrices(pk(100000, 200000, 300000)), null);
  assert.match(validatePackagePrices(pk(100000, 100000, 300000)), /tăng dần/);
  assert.match(validatePackagePrices(pk(300000, 200000, 400000)), /tăng dần/);
  assert.match(validatePackagePrices(pk(100000, 200000, 0)), /Cao cấp/);
});

test("applyMediaOp replays a partly finished save so the retry skips done work", () => {
  const form = {
    coverImage: "https://x/c.jpg",
    gallery: [{ url: "https://x/g1.jpg" }, { url: "https://x/g2.jpg" }],
    videoUrl: "https://youtu.be/v",
  };
  const ops = planMediaChanges(null, form);
  // cover and first gallery image saved, then the second image failed.
  let state = applyMediaOp(null, ops[0], "m-cover");
  state = applyMediaOp(state, ops[1], "m-g1");
  assert.deepEqual(state, {
    cover: { id: "m-cover", url: "https://x/c.jpg" },
    gallery: [{ id: "m-g1", url: "https://x/g1.jpg" }],
    video: null,
  });

  const retryForm = { ...form, gallery: attachGalleryIds(form.gallery, state) };
  assert.deepEqual(planMediaChanges(state, retryForm), [
    { op: "create", body: { url: "https://x/g2.jpg", mediaType: "IMAGE", cover: false } },
    { op: "create", body: { url: "https://youtu.be/v", mediaType: "VIDEO", cover: false } },
  ]);
});

test("applyMediaOp handles update and delete", () => {
  const start = {
    cover: { id: "c", url: "https://x/old.jpg" },
    gallery: [{ id: "g1", url: "https://x/1.jpg" }],
    video: { id: "v", url: "https://youtu.be/v" },
  };
  let s = applyMediaOp(start, { op: "update", id: "c", body: { url: "https://x/new.jpg", mediaType: "IMAGE", cover: true } });
  assert.deepEqual(s.cover, { id: "c", url: "https://x/new.jpg" });
  s = applyMediaOp(s, { op: "delete", id: "g1" });
  s = applyMediaOp(s, { op: "delete", id: "v" });
  assert.deepEqual(s, { cover: { id: "c", url: "https://x/new.jpg" }, gallery: [], video: null });
});

test("toServiceCard uses the service's own cover media, else a neutral placeholder (no stock photo)", () => {
  const dto = { serviceId: "s1", title: "Logo", slug: "logo" };
  const withMedia = toServiceCard(dto, {
    medias: [
      { serviceMediaId: "m2", url: "https://cdn/x/2.jpg", mediaType: "IMAGE", cover: false },
      { serviceMediaId: "m1", url: "https://cdn/x/1.jpg", mediaType: "IMAGE", cover: true },
    ],
  });
  assert.equal(withMedia.coverImage, "https://cdn/x/1.jpg");
  assert.equal(withMedia.imageSource, "real");

  const without = toServiceCard(dto, { medias: [] });
  assert.match(without.coverImage, /^data:image\/svg\+xml/);
  assert.doesNotMatch(without.coverImage, /picsum/);
  assert.equal(without.imageSource, "placeholder");
});

test("toServiceDetail leaves stats the backend does not have empty instead of inventing them", () => {
  const d = toServiceDetail({ service: { serviceId: "s1", title: "Logo", slug: "logo" } });
  assert.equal(d.responseTime, null);
  assert.equal(d.lastDelivery, null);
  assert.equal(d.memberSince, null);
  assert.deepEqual(d.languages, []);
  assert.equal(d.mediaList.length, 1);
  assert.doesNotMatch(d.coverImage, /picsum/);
  const joined = toServiceDetail({
    service: { serviceId: "s1" },
    provider: { providerProfileId: "p", businessName: "A", joinedAt: "2025-03-01T00:00:00Z" },
  });
  assert.equal(joined.memberSince, 2025);
});

test("countByRootCategory counts listed services per root category", () => {
  assert.deepEqual(
    countByRootCategory([{ rootCategoryId: "r1" }, { rootCategoryId: "r1" }, { rootCategoryId: "r2" }, {}]),
    { r1: 2, r2: 1 }
  );
});

test("defaultPackages starts neutral: tier names, empty descriptions, rising prices", () => {
  const tr = (k) => `<${k}>`;
  const p = defaultPackages(tr);
  assert.deepEqual([p.basic.title, p.standard.title, p.premium.title], ["<m1764>", "<m1765>", "<m1766>"]);
  assert.deepEqual([p.basic.desc, p.standard.desc, p.premium.desc], ["", "", ""]);
  assert.ok(p.basic.price < p.standard.price && p.standard.price < p.premium.price);
});
