import { test } from "node:test";
import assert from "node:assert/strict";
import { articlePreviewImage } from "./article-preview-image";

test("selected cover takes precedence over the article's first photo", () => {
  assert.equal(articlePreviewImage("https://example.com/cover.jpg", '<img src="https://example.com/body.jpg">'), "https://example.com/cover.jpg");
});

test("existing HTML photos supply previews without a selected cover", () => {
  assert.equal(articlePreviewImage(null, "<p>Article</p><img src='https://example.com/photo.jpg'>"), "https://example.com/photo.jpg");
});

test("legacy signed article photos use permanent public links", () => {
  assert.equal(articlePreviewImage(null, '<img src="https://example.supabase.co/storage/v1/object/sign/article-images/photo.jpg?token=expired&amp;download=1">'), "https://example.supabase.co/storage/v1/object/public/article-images/photo.jpg");
});

test("Markdown photos supply previews", () => {
  assert.equal(articlePreviewImage(null, '![Photo](https://example.com/photo.jpg "Caption")'), "https://example.com/photo.jpg");
});

test("articles without photos remain image-free and unsafe sources are rejected", () => {
  assert.equal(articlePreviewImage(null, "No photo"), null);
  assert.equal(articlePreviewImage("javascript:alert(1)"), null);
});