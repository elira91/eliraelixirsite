// api/contact.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'All required fields must be filled out.'
    });
  }

  try {
    // Get Microsoft Graph access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.MS_CLIENT_ID,
          client_secret: process.env.MS_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Microsoft token error:', tokenData);

      return res.status(500).json({
        error: 'Unable to authenticate with Microsoft.'
      });
    }

    // Send email through Microsoft Graph
    const graphResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${process.env.MS_SENDER_EMAIL}/sendMail`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject: `New Elira Elixir Contact Form Message from ${name}`,
            body: {
              contentType: 'HTML',
              content: `
                <h3>New Elira Elixir Contact Form Submission</h3>

                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>

                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
              `
            },
            toRecipients: [
              {
                emailAddress: {
                  address: process.env.MS_RECIPIENT_EMAIL
                }
              }
            ],
            replyTo: [
              {
                emailAddress: {
                  address: email,
                  name: name
                }
              }
            ]
          },
          saveToSentItems: true
        })
      }
    );

    if (!graphResponse.ok) {
      const graphError = await graphResponse.text();

      console.error('Microsoft Graph error:', graphError);

      return res.status(500).json({
        error: 'Unable to send the message.'
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error('Contact form error:', error);

    return res.status(500).json({
      error: 'Failed to send message.'
    });
  }
}
