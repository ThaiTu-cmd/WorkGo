import test from "node:test";
import assert from "node:assert/strict";
import {
  addonsToForm,
  mediasToForm,
  planAddonChanges,
  planMediaChanges,
} from "../src/_webapp-mirror/pages/ServiceForm/serviceFormSync.js";
import { isHttpUrl, validateAddons } from "../src/_webapp-mirror/pages/ServiceForm/formValidation.js";

test("addonsToForm keeps only add-ons with an id", () => {
  assert.deepEqual(
    addonsToForm([
      { addOnId: "a1", name: "Gấp", description: "24h", price: "200000" },
      { addOnId: null, name: "Cũ" },
    ]),
    [{ id: "a1", name: "Gấp", desc: "24h", price: 200000 }]
  );
});

test("planAddonChanges creates new rows, updates kept ones and deletes removed ids", () => {
  const plan = planAddonChanges(
    ["a1", "a2"],
    [
      { id: "a1", name: " Gấp ", desc: "24h", price: 200000 },
      { key: "new-1", name: "Source", desc: "", price: 500000 },
    ]
  );
  assert.deepEqual(plan.create, [{ name: "Source", description: "", price: 500000, currency: "VND" }]);
  assert.deepEqual(plan.update, [{ id: "a1", body: { name: "Gấp", description: "24h", price: 200000, currency: "VND" } }]);
  assert.deepEqual(plan.remove, ["a2"]);
});

test("mediasToForm splits cover, gallery and video", () => {
  const form = mediasToForm([
    { serviceMediaId: "m1", url: "https://x/1.jpg", mediaType: "IMAGE", cover: false },
    { serviceMediaId: "m2", url: "https://x/2.jpg", mediaType: "IMAGE", cover: true },
    { serviceMediaId: "m3", url: "https://youtu.be/v", mediaType: "VIDEO", cover: false },
  ]);
  assert.deepEqual(form.cover, { id: "m2", url: "https://x/2.jpg" });
  assert.deepEqual(form.gallery, [{ id: "m1", url: "https://x/1.jpg" }]);
  assert.deepEqual(form.video, { id: "m3", url: "https://youtu.be/v" });
});

test("planMediaChanges on a new service creates cover, gallery and video", () => {
  const ops = planMediaChanges(null, {
    coverImage: "https://x/c.jpg",
    gallery: [{ url: "https://x/g.jpg" }],
    videoUrl: "",
  });
  assert.deepEqual(ops, [
    { op: "create", body: { url: "https://x/c.jpg", mediaType: "IMAGE", cover: true } },
    { op: "create", body: { url: "https://x/g.jpg", mediaType: "IMAGE", cover: false } },
  ]);
});

test("planMediaChanges on edit updates the cover, deletes removed images and the cleared video", () => {
  const original = {
    cover: { id: "c", url: "https://x/old.jpg" },
    gallery: [{ id: "g1", url: "https://x/1.jpg" }, { id: "g2", url: "https://x/2.jpg" }],
    video: { id: "v", url: "https://youtu.be/v" },
  };
  const ops = planMediaChanges(original, {
    coverImage: "https://x/new.jpg",
    gallery: [{ id: "g2", url: "https://x/2.jpg" }],
    videoUrl: " ",
  });
  assert.deepEqual(ops, [
    { op: "update", id: "c", body: { url: "https://x/new.jpg", mediaType: "IMAGE", cover: true } },
    { op: "delete", id: "g1" },
    { op: "delete", id: "v" },
  ]);
});

test("planMediaChanges does nothing when nothing changed", () => {
  const original = { cover: { id: "c", url: "https://x/c.jpg" }, gallery: [], video: null };
  assert.deepEqual(planMediaChanges(original, { coverImage: "https://x/c.jpg", gallery: [], videoUrl: "" }), []);
});

test("validateAddons needs a name and a positive price", () => {
  assert.equal(validateAddons([]), null);
  assert.equal(validateAddons([{ name: "Giao gấp", price: 100000 }]), null);
  assert.match(validateAddons([{ name: "ab", price: 100000 }]), /tên/);
  assert.match(validateAddons([{ name: "Giao gấp", price: 0 }]), /giá/);
});

test("isHttpUrl accepts only http(s) URLs", () => {
  assert.equal(isHttpUrl("https://x/a.jpg"), true);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(isHttpUrl(""), false);
});
