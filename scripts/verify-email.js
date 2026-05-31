// 直接在浏览器控制台运行的脚本 - 验证 sunxi0302@gmail.com
// 使用方法：在 pandahan.xyz 网站登录后，按 F12 打开控制台，粘贴以下代码

(async () => {
  const ADMIN_KEY = 'Sunxi1234';
  const email = 'sunxi0302@gmail.com';

  try {
    const res = await fetch('/api/admin/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);

    if (res.ok) {
      alert('✅ 邮箱验证成功！请刷新页面。');
    } else {
      alert('❌ 失败: ' + (data.error || '未知错误'));
    }
  } catch (e) {
    console.error('Error:', e);
    alert('❌ 请求失败: ' + e.message);
  }
})();
