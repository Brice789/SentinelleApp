// next.config.mjs
export default {
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        child_process: false,
      };
    }
    return config;
  },
};
