/**
 * PWA 图标生成脚本
 *
 * 使用方法:
 * 1. 安装依赖: npm install sharp
 * 2. 运行: node scripts/generate-pwa-icons.mjs
 *
 * 将 favicon.svg 转换为各尺寸 PNG 图标
 * 注意: 建议后续用设计师设计的正式图标替换生成的 PNG
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('sharp 未安装。请先运行: npm install sharp');
    console.log('或者手动创建以下 PNG 图标:');
    console.log('  - public/icon-192x192.png (192x192)');
    console.log('  - public/icon-512x512.png (512x512)');
    process.exit(1);
  }

  const svgPath = resolve(__dirname, '../public/favicon.svg');
  const sizes = [192, 512];

  mkdirSync(resolve(__dirname, '../public'), { recursive: true });

  for (const size of sizes) {
    const outputPath = resolve(__dirname, `../public/icon-${size}x${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${outputPath}`);
  }

  // 更新 manifest.json 添加 PNG 图标
  console.log('\n图标生成完成！建议将 manifest.json 的 icons 更新为:');
  console.log(JSON.stringify([
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ], null, 2));
}

main().catch(console.error);
