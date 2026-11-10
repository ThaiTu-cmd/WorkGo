import test from "node:test";
import assert from "node:assert/strict";
import axiosClient, { ApiError, buildApiErrorMessage } from "../src/_webapp-mirror/api/axiosClient.js";

test("404 HTML trả message chẩn đoán, không phải HTTP 404 trần", () => {
  const msg = buildApiErrorMessage(404, null, "text/html; charset=iso-8859-1");
  assert.match(msg, /HTTP 404/);
  assert.match(msg, /identity-service/);
});

test("message JSON của backend được ưu tiên", () => {
  assert.equal(
    buildApiErrorMessage(400, { code: 1001, message: "User existed" }, "application/json"),
    "User existed"
  );
});

test("5xx không body dùng message mất kết nối", () => {
  const msg = buildApiErrorMessage(500, null, "text/html");
  assert.match(msg, /kết nối/i);
});

test("ApiError giữ status/code và map 1007 sang 403", () => {
  const err = new ApiError(401, { code: 1007, message: "forbidden" }, "application/json");
  assert.equal(err.status, 403);
  assert.equal(err.code, 1007);
});

test("404 JSON vẫn dùng message HTTP 404", () => {
  assert.match(buildApiErrorMessage(404, null, "application/json"), /HTTP 404/);
});

test("request 404 HTML ném ApiError với message chẩn đoán", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("<html>Not Found</html>", {
      status: 404,
      headers: { "content-type": "text/html; charset=iso-8859-1" },
    });

  try {
    await assert.rejects(
      () => axiosClient.get("/identity/users/registration"),
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.match(err.message, /identity-service/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
