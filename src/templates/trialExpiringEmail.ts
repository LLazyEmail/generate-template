export const TrialExpiringEmail = (payload: { name: string; preheader: string; trial_end_date: string; trial_days_remaining: string; plan_name: string; plan_price: string; action_url: string; secondary_url: string; support_url: string; benefits: Array<{ title: string }>; product_name: string; company_name: string; company_address: string; company_suite: string; company_url: string }) => {
  const benefits = payload.benefits.map(benefit => 
    `<li>${benefit.title}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Trial Expiring Soon</title>
</head>
<body>
  <h1>Your ${payload.plan_name} Trial is Expiring</h1>
  <p>${payload.preheader}</p>
  <p>Hello ${payload.name},</p>
  <p>Your trial ends in ${payload.trial_days_remaining} days (${payload.trial_end_date}).</p>
  <p>Plan: ${payload.plan_name} at ${payload.plan_price}</p>
  <h2>Benefits you'll enjoy:</h2>
  <ul>${benefits}</ul>
  <p><a href="${payload.action_url}">Upgrade Now</a></p>
  <p><a href="${payload.secondary_url}">View Pricing</a></p>
  <p>Support: <a href="${payload.support_url}">${payload.support_url}</a></p>
  <p>${payload.product_name} - ${payload.company_name}</p>
  <p>${payload.company_address} ${payload.company_suite}</p>
  <p><a href="${payload.company_url}">${payload.company_url}</a></p>
</body>
</html>`;
};
