// global.d.ts or app/global.d.ts
declare module "*.css" {
  const content: string;
  export default content;
}

// Specifically for leaflet CSS
declare module "leaflet/dist/leaflet.css";
