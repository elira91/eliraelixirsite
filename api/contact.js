import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All required fields must be filled out.' });
  }

  try {
    const data = await resend.emails.send({
      from: 'Elira Elixir Contact <onboarding@resend.dev>',
      to: ['contact@eliraelixir.ca'],
      subject: subject
        ? `Elira Elixir Contact: ${subject}`
        : `New Contact Form Inquiry from ${name}`,
      reply_to: email,
      html: `
        <h3>New Contact Form Submission</h3>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'No subject provided'}</p>

        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
}
