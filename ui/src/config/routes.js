/**
 * Route Configuration
 *
 * Add your page routes here. The router will automatically register these routes.
 *
 * Format:
 * - string: Simple route that maps to a page with the same name
 * - object: Advanced route configuration with custom settings
 */

export const routes = [
  // Main application pages
  "home",
  "chat",
  "chart",
  "excel"

  // Example of advanced route configuration:
  // {
  //   path: '/custom-path',
  //   page: 'my-page',
  //   title: 'Custom Page Title'
  // }
];

/**
 * Route aliases - redirects one path to another
 */
export const aliases = {
  "/": "/home",
  "/pdf-extraction": "/home"
  // Add more aliases as needed
};
