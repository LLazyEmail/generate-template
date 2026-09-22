export const passwordReset = (payload: { name: string; preheader: string; action_url: string; operating_system: string; browser_name: string; support_url: string; product_name: string; company_name: string; company_address: string; company_suite: string; company_url: string }) => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Password Reset</title>
</head>
<body>
  <h1>Password Reset for ${payload.name}</h1>
  <p>${payload.preheader}</p>
  <p>Click <a href="${payload.action_url}">here</a> to reset your password.</p>
  <p>Requested from ${payload.operating_system} using ${payload.browser_name}</p>
  <p>Support: <a href="${payload.support_url}">${payload.support_url}</a></p>
  <p>${payload.product_name} - ${payload.company_name}</p>
  <p>${payload.company_address} ${payload.company_suite}</p>
  <p><a href="${payload.company_url}">${payload.company_url}</a></p>
</body>
</html>`;
};
