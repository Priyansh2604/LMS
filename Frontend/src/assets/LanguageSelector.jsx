import "./LanguageSelector.css";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
];

const originalText = new WeakMap();
const translationCache = new Map();

function getTextNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(".language-control") || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/.test(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  let node = walker.nextNode();

  while (node) {
    if (!originalText.has(node)) originalText.set(node, node.textContent);
    nodes.push(node);
    node = walker.nextNode();
  }

  return nodes;
}

function normalizeTranslatedTexts(payload, expectedLength) {
  const items = [];

  if (Array.isArray(payload)) {
    payload.forEach((item) => {
      if (typeof item === "string") items.push(item);
      else if (item && typeof item === "object" && typeof item.translatedText === "string") items.push(item.translatedText);
    });
  } else if (typeof payload === "string") {
    items.push(payload);
  } else if (payload && typeof payload === "object") {
    if (typeof payload.translatedText === "string") items.push(payload.translatedText);
    if (Array.isArray(payload.translatedText)) items.push(...payload.translatedText.filter((item) => typeof item === "string"));
    if (Array.isArray(payload.data)) {
      payload.data.forEach((item) => {
        if (typeof item === "string") items.push(item);
        else if (item && typeof item === "object" && typeof item.translatedText === "string") items.push(item.translatedText);
      });
    }
  }

  if (items.length === expectedLength) return items;
  if (items.length === 1 && expectedLength === 1) return items;
  return [];
}

async function translateTexts(texts, target) {
  const missingTexts = texts.filter((text) => !translationCache.has(`${target}:${text}`));
  if (!missingTexts.length) return texts.map((text) => translationCache.get(`${target}:${text}`));

  const response = await fetch(`${API_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: missingTexts, target }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Translation request failed");
  const translatedTexts = normalizeTranslatedTexts(result.translatedText, missingTexts.length) || normalizeTranslatedTexts(result, missingTexts.length);

  if (!translatedTexts.length || translatedTexts.length !== missingTexts.length) {
    throw new Error("Invalid translation response");
  }

  missingTexts.forEach((text, index) => translationCache.set(`${target}:${text}`, translatedTexts[index]));
  return texts.map((text) => translationCache.get(`${target}:${text}`));
}

function LanguageSelector() {
  const location = useLocation();
  const [language, setLanguage] = useState(() => localStorage.getItem("learnlyLanguage") || "en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState("");
  const runId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const nodes = getTextNodes();
    const id = ++runId.current;

    nodes.forEach((node) => {
      node.textContent = originalText.get(node);
    });

    if (language === "en") {
      return () => { cancelled = true; };
    }

    const texts = [...new Set(nodes.map((node) => originalText.get(node).trim()))];

    translateTexts(texts, language)
      .then((translatedTexts) => {
        if (cancelled || id !== runId.current) return;
        const translatedByText = new Map(texts.map((text, index) => [text, translatedTexts[index]]));
        nodes.forEach((node) => {
          const source = originalText.get(node);
          const leadingSpace = source.match(/^\s*/)[0];
          const trailingSpace = source.match(/\s*$/)[0];
          const translated = translatedByText.get(source.trim());
          if (translated) node.textContent = `${leadingSpace}${translated}${trailingSpace}`;
        });
      })
      .catch(() => {
        if (!cancelled) setError("Translation service unavailable");
      })
      .finally(() => {
        if (!cancelled) setIsTranslating(false);
      });

    return () => { cancelled = true; };
  }, [language, location.pathname]);

  function handleChange(event) {
    const nextLanguage = event.target.value;
    localStorage.setItem("learnlyLanguage", nextLanguage);
    setError("");
    setIsTranslating(nextLanguage !== "en");
    setLanguage(nextLanguage);
  }

  return (
    <label className="language-control" title="Translate Learnly">
      <span className="language-icon" aria-hidden="true">文</span>
      <span className="sr-only">Language</span>
      <select value={language} onChange={handleChange} disabled={isTranslating && language !== "en"} aria-label="Choose language">
        {languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
      {isTranslating && language !== "en" && <span className="language-status" aria-live="polite">...</span>}
      {error && <span className="language-error" role="status" title={error} aria-label={error}>!</span>}
    </label>
  );
}

export default LanguageSelector;