/// <reference types="vite/client" />

type PrismGlobal = {
  languages: Record<string, unknown>;
  manual?: boolean;
  disableWorkerMessageHandler?: boolean;
  [key: string]: unknown;
};

declare module "prismjs" {
  const Prism: PrismGlobal;
  export default Prism;
}

declare global {
  var Prism: PrismGlobal;
}
