const emailSenderURL =
  'https://email-service.digitalenvision.com.au/send-email';
const emailTimeoutMS = 5000;

interface EmailSenderResponse {
  status: string;
  sentTime: string;
}
export async function sendEmail(email: string, message: string): Promise<void> {
  try {
    const response = await fetch(emailSenderURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        message: message,
      }),
      signal: AbortSignal.timeout(emailTimeoutMS),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as EmailSenderResponse;
    if (data.status !== 'sent') {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Email send request timed out');
    }
    throw error;
  }
}

export async function sendBirthdayEmail(
  email: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  const message = `Happy birthday ${firstName} ${lastName}!`;
  await sendEmail(email, message);
}
