import { component$ } from "@builder.io/qwik";
import { useLocation, routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { allProducts } from "../../apparel/products";
import { ProductDetailPanel } from "../../../components/product-detail/product-detail";

// Unknown product slugs (including the retired "/apparel" path) redirect to the
// catalog rather than rendering an empty product page.
export const useProductGuard = routeLoader$(({ params, redirect }) => {
  if (!allProducts.some((p) => p.sku === params.sku)) {
    throw redirect(302, "/");
  }
  return {};
});

// The /<sku>/ route: a thin wrapper around <ProductDetailPanel>. It renders into
// the shared shell's main column (the group layout keeps ProductCatalog — and so
// the sidebar/header — mounted), so navigating catalog ↔ product never shifts.
export default component$(() => {
  const loc = useLocation();
  return <ProductDetailPanel sku={loc.params.sku} />;
});

export const head: DocumentHead = ({ params }) => {
  const product = allProducts.find((p) => p.sku === params.sku);
  return {
    title: product ? `${product.name} - Modern Niagara Building Services Apparel` : "Product - Modern Niagara Building Services Apparel",
  };
};
