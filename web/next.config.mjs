/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        // wagmi's MetaMask connector and Privy reference optional native/solana
        // modules that don't exist in a web build. Tell webpack to ignore them
        // instead of failing to resolve (which breaks the chunk and causes
        // ChunkLoadError at runtime).
        config.resolve.fallback = {
            ...config.resolve.fallback,
            "@react-native-async-storage/async-storage": false,
            "@farcaster/mini-app-solana": false,
        };
        config.externals.push("pino-pretty", "lokijs", "encoding");
        return config;
    },
};
export default nextConfig;
