{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/metrics", "dest": "/index.js" },
    { "src": "/puppeteer", "dest": "/index.js" },
    { "src": "/proxy/.*", "dest": "/index.js" },
    { "src": "/bare/.*", "dest": "/index.js" },
    { "src": "/.*", "dest": "/index.js" }
  ]
}
