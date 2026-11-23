import type { RequestHandler } from "@builder.io/qwik-city";

// Logout: clear the login cookie and always go to the home page (which shows
// the login gate) — whatever page the button was pressed on. A plain form POST
// to this address, so it works the same from every page (incl. /checkout/).
const logout: RequestHandler = async ({ cookie, redirect, headers }) => {
  cookie.delete("ce_auth", { path: "/" });
  headers.set("Cache-Control", "no-store");
  throw redirect(303, "/");
};
export const onPost = logout;
export const onGet = logout;
