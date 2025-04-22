// next.config.js
module.exports = {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Frame-Options",
              value: "ALLOWALL", // Allows embedding anywhere
            },
            {
              key: "Content-Security-Policy",
              value: "frame-ancestors *", // Or restrict to your portfolio domain for more security
            },
          ],
        },
      ];
    },
  };