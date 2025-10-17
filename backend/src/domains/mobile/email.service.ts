/**
 * Email Service for Observer Notifications
 *
 * TODO: Implement with actual email provider
 * Options: Nodemailer (SMTP), SendGrid, AWS SES, Mailgun
 */

export class EmailService {
  private readonly appUrl = process.env.APP_URL || 'http://localhost:5173';

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    email: string,
    firstName: string,
    trackingNumber: string
  ): Promise<void> {
    const subject = 'Observer Registration Received';
    const html = `
      <h2>Hello ${firstName},</h2>
      <p>Thank you for registering as a field observer.</p>
      <p>Your application has been received and is currently under review.</p>
      
      <p><strong>Application Tracking Number:</strong> ${trackingNumber}</p>
      <p>You can track your application status at:</p>
      <p><a href="${this.appUrl}/mobile/track/${trackingNumber}">Track Application</a></p>
      
      <p>You will receive another email when your application is reviewed (typically within 24-48 hours).</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send password setup email
   */
  async sendPasswordSetupEmail(
    email: string,
    firstName: string,
    setupToken: string
  ): Promise<void> {
    const subject = 'Observer Application Approved - Set Your Password';
    const setupUrl = `${this.appUrl}/mobile/setup-password?token=${setupToken}`;

    const html = `
      <h2>Congratulations ${firstName}!</h2>
      <p>Your observer application has been approved.</p>
      
      <p>To complete your registration, please set up your password by clicking the link below:</p>
      <p><a href="${setupUrl}">Set Up Password</a></p>
      
      <p><strong>Important:</strong> This link will expire in 48 hours.</p>
      
      <p>After setting your password, you can login to the observer portal and start submitting election results.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send welcome email after password setup
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const subject = 'Welcome to Field Observer Portal';
    const loginUrl = `${this.appUrl}/mobile/login`;

    const html = `
      <h2>Welcome ${firstName}!</h2>
      <p>Your field observer account is now active.</p>
      
      <p>You can now login to the observer portal:</p>
      <p><a href="${loginUrl}">Login to Observer Portal</a></p>
      
      <p>Once logged in, you will:</p>
      <ul>
        <li>See your assigned polling stations</li>
        <li>Submit election results</li>
        <li>Upload Form 34A photos</li>
        <li>Track your submissions</li>
      </ul>
      
      <p>The mobile app works offline, so you can submit results even without internet connection.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send rejection email
   */
  async sendRejectionEmail(
    email: string,
    firstName: string,
    rejectionReason: string
  ): Promise<void> {
    const subject = 'Observer Application Status Update';

    const html = `
      <h2>Hello ${firstName},</h2>
      <p>Thank you for your interest in becoming a field observer.</p>
      
      <p>After careful review, we are unable to approve your application at this time.</p>
      
      <p><strong>Reason:</strong> ${rejectionReason}</p>
      
      <p>If you believe this is an error or have questions, please contact our support team.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send clarification request email
   */
  async sendClarificationRequest(
    email: string,
    firstName: string,
    notes: string
  ): Promise<void> {
    const subject = 'Observer Application - Additional Information Required';

    const html = `
      <h2>Hello ${firstName},</h2>
      <p>We are reviewing your observer application and need some clarification:</p>
      
      <p><strong>Notes:</strong></p>
      <p>${notes}</p>
      
      <p>Please contact our support team to provide the requested information.</p>
      
      <p>Best regards,<br>Election Management Team</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Base email sending function
   * TODO: Implement with actual email provider
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    // TODO: Implement with actual email service
    console.log('=== EMAIL ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('=============');

    /*
    // Example with Nodemailer (SMTP):
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@etally.com',
      to,
      subject,
      html,
    });
    */

    // For now, just log (implement actual email sending later)
    return Promise.resolve();
  }
}
