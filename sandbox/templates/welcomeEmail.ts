export const WelcomeEmail = (payload: { userName: string; signupDate: Date; preheader: string; action_url: string; action_label: string; support_url: string; product_name: string; company_name: string; company_address: string; company_suite: string; company_url: string }) => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Welcome to ${payload.product_name}</title>
</head>
<body>
  <h1>Welcome, ${payload.userName}!</h1>
  <p>${payload.preheader}</p>
  <p>Thank you for signing up on ${payload.signupDate.toLocaleDateString()}.</p>
  <p><a href="${payload.action_url}">${payload.action_label}</a></p>
  <p>Support: <a href="${payload.support_url}">${payload.support_url}</a></p>
  <p>${payload.product_name} - ${payload.company_name}</p>
  <p>${payload.company_address} ${payload.company_suite}</p>
  <p><a href="${payload.company_url}">${payload.company_url}</a></p>
</body>
</html>`;
};
