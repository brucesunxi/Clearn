// 在浏览器控制台运行（F12 -> Console）
// 先获取当前用户信息，然后直接验证邮箱

(async () => {
  // 获取当前登录用户
  const meRes = await fetch('/api/auth/me');
  const meData = await meRes.json();
  console.log('当前用户:', meData);

  if (!meData.user) {
    alert('请先登录！');
    return;
  }

  const email = meData.user.email;
  console.log('验证邮箱:', email);

  // 尝试直接访问验证链接（如果有token）
  // 或者调用重新发送验证邮件
  const resendRes = await fetch('/api/auth/resend-verification', {
    method: 'POST'
  });
  const resendData = await resendRes.json();
  console.log('重新发送结果:', resendData);

  if (resendRes.ok) {
    alert('验证邮件已发送！请检查 Mailtrap 收件箱。\n\n注意：因为使用的是 Mailtrap 测试服务，邮件不会发到真实邮箱，\n需要登录 mailtrap.io 查看虚拟收件箱。');
  } else {
    alert('发送失败: ' + (resendData.error || '未知错误'));
  }
})();
