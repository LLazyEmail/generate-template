export const UserInvitationEmail = (payload: { invitee_name: string; invitee_email: string; inviter_name: string; workspace_name: string; role: string; preheader: string; action_url: string; decline_url: string; expires_at: string; support_url: string; product_name: string; company_name: string; company_address: string; company_suite: string; company_url: string }) => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Invitation to Join ${payload.workspace_name}</title>
</head>
<body>
  <h1>You're Invited!</h1>
  <p>${payload.preheader}</p>
  <p>Hello ${payload.invitee_name},</p>
  <p>${payload.inviter_name} has invited you to join ${payload.workspace_name} as a ${payload.role}.</p>
  <p><a href="${payload.action_url}">Accept Invitation</a></p>
  <p><a href="${payload.decline_url}">Decline Invitation</a></p>
  <p>This invitation expires on ${payload.expires_at}.</p>
  <p>Support: <a href="${payload.support_url}">${payload.support_url}</a></p>
  <p>${payload.product_name} - ${payload.company_name}</p>
  <p>${payload.company_address} ${payload.company_suite}</p>
  <p><a href="${payload.company_url}">${payload.company_url}</a></p>
</body>
</html>`;
};
