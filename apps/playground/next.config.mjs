/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['goiasscript'],
  webpack: (config) => {
    // The browser entry of goiasscript is plain CommonJS without fs/path,
    // so the default loaders handle it. We only need to make sure Webpack
    // doesn't try to polyfill Node built-ins that are never imported.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    return config;
  },
};

export default nextConfig;
