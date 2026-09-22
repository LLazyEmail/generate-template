export const InvoiceEmail = (payload: { name: string; preheader: string; invoice_id: string; date: string; total: string; due_date: string; purchase_date: string; action_url: string; support_url: string; invoice_details: Array<{ description: string; amount: string }>; product_name: string; company_name: string; company_address: string; company_suite: string; company_url: string }) => {
  const details = payload.invoice_details.map(item => 
    `<li>${item.description}: ${item.amount}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${payload.invoice_id}</title>
</head>
<body>
  <h1>Invoice ${payload.invoice_id}</h1>
  <p>${payload.preheader}</p>
  <p>Hello ${payload.name},</p>
  <p>Invoice Date: ${payload.date}</p>
  <p>Due Date: ${payload.due_date}</p>
  <p>Purchase Date: ${payload.purchase_date}</p>
  <p>Total Due: ${payload.total}</p>
  <h2>Invoice Details:</h2>
  <ul>${details}</ul>
  <p><a href="${payload.action_url}">Pay Invoice</a></p>
  <p>Support: <a href="${payload.support_url}">${payload.support_url}</a></p>
  <p>${payload.product_name} - ${payload.company_name}</p>
  <p>${payload.company_address} ${payload.company_suite}</p>
  <p><a href="${payload.company_url}">${payload.company_url}</a></p>
</body>
</html>`;
};
