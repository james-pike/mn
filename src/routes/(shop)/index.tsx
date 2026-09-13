import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

// The catalog IS the home route. The ProductCatalog shell is rendered by the
// group layout; this entry just provides the route + document head. The catalog
// grid shows because the layout's <Slot/> (this component) is empty.
export default component$(() => {
  return <></>;
});

export const head: DocumentHead = {
  title: "Modern Niagara Building Services Apparel",
  meta: [
    { name: "description", content: "Premium Branded Modern Niagara Building Services Apparel" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "theme-color", content: "#ffffff" },
    { property: "og:title", content: "Modern Niagara Building Services Apparel" },
    { property: "og:description", content: "Premium Branded Modern Niagara Building Services Apparel" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://www.mnbsapparel.ca/" },
    { property: "og:image", content: "https://www.mnbsapparel.ca/modernniagara-logo.png" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "Modern Niagara Building Services Apparel" },
    { name: "twitter:description", content: "Premium Branded Modern Niagara Building Services Apparel" },
    { name: "twitter:image", content: "https://www.mnbsapparel.ca/modernniagara-logo.png" },
  ],
};
