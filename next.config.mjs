/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com", 
        pathname: "/**",                
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", 
        pathname: "/**",               
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
        pathname: "/**",
      }
    ],
    domains: ['localhost']
  },
};

export default nextConfig;
  