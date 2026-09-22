export const orderConfirmation = (payload: { name: string; preheader: string; order_id: string; order_date: string; total: string; order_items: Array<{ description: string; unit_price: string; quantity: string; total: string }>; shipping_address: string; billing_address: string; action_url: string; support_url: string; product_name: string; company_name: string; company_address: string; company_suite: string; company_url: string }) => {
  const items = payload.order_items.map(item => 
    `<li>${item.description} - ${item.unit_price} x ${item.quantity} = ${item.total}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Order Confirmation</title>
</head>
<body>
  <h1>Order Confirmation #${payload.order_id}</h1>
  <p>${payload.preheader}</p>
  <p>Thank you ${payload.name}!</p>
  <p>Order Date: ${payload.order_date}</p>
  <p>Total: ${payload.total}</p>
  <h2>Order Items:</h2>
  <ul>${items}</ul>
  <p>Shipping Address:</p>
  <p>${payload.shipping_address}</p>
  ${payload.billing_address ? `<p>Billing Address:</p><p>${payload.billing_address}</p>` : ''}
  <p><a href="${payload.action_url}">View Order</a></p>
  <p>Support: <a href="${payload.support_url}">${payload.support_url}</a></p>
  <p>${payload.product_name} - ${payload.company_name}</p>
  <p>${payload.company_address} ${payload.company_suite}</p>
  <p><a href="${payload.company_url}">${payload.company_url}</a></p>
</body>
</html>`;
};
