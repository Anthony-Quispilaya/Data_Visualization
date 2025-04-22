// next.config.js
module.exports = {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            // This allows your site to be embedded in any iframe
            {
              key: "X-Frame-Options",
              value: "ALLOWALL",
            },
            // This sets CSP to allow embedding from anywhere (or restrict to your portfolio domain)
            {
              key: "Content-Security-Policy",
              value: "frame-ancestors *",
            },
          ],
        },
      ];
    },
  };