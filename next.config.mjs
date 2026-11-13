/** @type {import('next').NextConfig} */
const nextConfig = {
  // Seamlessly proxy all frontend /api/* requests to the Python FastAPI backend on port 8000
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
