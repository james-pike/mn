import { component$, useContext } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LocaleContext, t } from "../../i18n";

export default component$(() => {
  const locale = useContext(LocaleContext);
  return (
    <main class="privacy-page">
      <h1 class="privacy-page__title">{t("privacy.title", locale.value)}</h1>
      <p class="privacy-page__body">{t("privacy.body", locale.value)}</p>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Privacy Policy — Modern Niagara Apparel",
};
