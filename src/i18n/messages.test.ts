import { describe, expect, it } from "vitest";

import bsMessages from "../../messages/bs.json";
import enMessages from "../../messages/en.json";

import { routing, type AppLocale } from "@/i18n/routing";

type MessageTree = {
  readonly [key: string]: MessageTree | string;
};

function flattenMessages(
  messages: MessageTree,
  parentKey = "",
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const messageKey = parentKey ? `${parentKey}.${key}` : key;

      return typeof value === "string"
        ? [[messageKey, value]]
        : Object.entries(flattenMessages(value, messageKey));
    }),
  );
}

function getMessageArgumentSignatures(message: string) {
  return Array.from(
    message.matchAll(
      /\{([A-Za-z][\w-]*)(?:\s*,\s*([A-Za-z][\w-]*))?(?=\s*[,}])/g,
    ),
    ([, argument, format]) => `${argument}:${format ?? "string"}`,
  ).sort();
}

describe("translation messages", () => {
  const messagesByLocale = {
    bs: flattenMessages(bsMessages),
    en: flattenMessages(enMessages),
  } satisfies Record<AppLocale, Record<string, string>>;
  const defaultMessages = messagesByLocale[routing.defaultLocale];
  const translatedMessages = Object.entries(messagesByLocale).filter(
    ([locale]) => locale !== routing.defaultLocale,
  );

  it.each(translatedMessages)(
    "%s has the same keys as the default locale",
    (_locale, messages) => {
      expect(Object.keys(messages).sort()).toEqual(
        Object.keys(defaultMessages).sort(),
      );
    },
  );

  it.each(translatedMessages)(
    "%s uses the same arguments as the default locale",
    (_locale, messages) => {
      for (const [key, defaultMessage] of Object.entries(defaultMessages)) {
        expect(getMessageArgumentSignatures(messages[key] ?? ""), key).toEqual(
          getMessageArgumentSignatures(defaultMessage),
        );
      }
    },
  );
});
