const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WebpackBar = require('webpackbar');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Only analyze bundle in production when specifically requested
      if (process.env.ANALYZE) {
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: 'bundle-report.html',
          })
        );
      }

      // Add progress bar
      webpackConfig.plugins.push(
        new WebpackBar()
      );
      
      // Optimize for production builds with extremely limited memory
      if (env === 'production') {
        // Disable source maps completely
        webpackConfig.devtool = false;
        
        // Reduce parallel processes to minimize memory usage
        webpackConfig.parallelism = 1;
        
        // Set low memory mode for Terser
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          minimizer: [
            new TerserPlugin({
              parallel: false, // Disable parallelism to reduce memory usage
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  ecma: 5, // Use older ECMAScript version for better compatibility
                  keep_classnames: false,
                  keep_fnames: false,
                },
                mangle: true,
                output: {
                  comments: false,
                  beautify: false,
                },
              },
              extractComments: false,
            }),
          ],
          // Use smaller chunks with more aggressive size optimization
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 5, // Reduce from Infinity to limit memory usage
            minSize: 25000, // Increase minimum size to reduce number of chunks
            maxSize: 244000, // Limit maximum chunk size
            cacheGroups: {
              // Group major dependencies to reduce chunk count
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                name: 'vendor-react',
                chunks: 'all',
                priority: 10,
              },
              bootstrap: {
                test: /[\\/]node_modules[\\/](bootstrap|react-bootstrap)[\\/]/,
                name: 'vendor-bootstrap',
                chunks: 'all',
                priority: 9,
              },
              // Group remaining vendor code
              vendors: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 1,
              },
            },
          },
          // Reduce runtime overhead
          runtimeChunk: {
            name: 'runtime',
          },
        };
      }

      return webpackConfig;
    }
  },
  // Reduce build memory usage
  babel: {
    loaderOptions: {
      cacheDirectory: true,
      cacheCompression: false,
      compact: true,
    },
    // Limit plugins and presets to essentials
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'entry',
          corejs: 3,
          modules: false,
          exclude: ['transform-typeof-symbol'],
        }
      ],
      '@babel/preset-react'
    ],
  },
  // Optimize PostCSS for memory usage
  style: {
    postcss: {
      loaderOptions: {
        // Minimize PostCSS memory usage
        postcssOptions: {
          config: false, // Skip config lookup
          plugins: [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
          ],
        },
      },
    },
  },
}; 