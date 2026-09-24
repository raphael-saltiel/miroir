/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/mirror", permanent: false }];
  },
};

export default nextConfig;
