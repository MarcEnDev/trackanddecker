import type {NextConfig} from 'next';

// IMPORTANT: Update this with the name of your GitHub repository
const repoName = 'deckmatch'; 

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  // Configure the project for static export
  output: 'export',
  
  // Set the base path for GitHub Pages
  basePath: isGithubActions ? `/${repoName}` : '',
  
  // Disable image optimization, as it's not supported with static export
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
