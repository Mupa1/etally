import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedEmailTemplates() {
  console.log('📧 Seeding email templates...');

  const templates = [
    {
      name: 'Registration Confirmation',
      subject: 'Observer Registration Received',
      body: `<h2>Hello {{firstName}},</h2>
<p>Thank you for registering as a field observer.</p>
<p>Your application has been received and is currently under review.</p>

<p><strong>Application Tracking Number:</strong> {{trackingNumber}}</p>
<p>You can track your application status at:</p>
<p><a href="{{appUrl}}/agent/track/{{trackingNumber}}">Track Application</a></p>

<p>You will receive another email when your application is reviewed (typically within 24-48 hours).</p>

<p>Best regards,<br>Election Management Team</p>`,
      description: 'Sent to observers when they register',
      templateType: 'registration_confirmation' as const,
      variables: {
        firstName: 'Observer first name',
        trackingNumber: 'Application tracking number',
        appUrl: 'Application base URL',
      },
    },
    {
      name: 'Password Setup',
      subject: 'Observer Application Approved - Set Your Password',
      body: `<h2>Congratulations {{firstName}}!</h2>
<p>Your observer application has been approved.</p>

<p>To complete your registration, please set up your password by clicking the link below:</p>
<p><a href="{{setupUrl}}">Set Up Password</a></p>

<p><strong>Important:</strong> This link will expire in 48 hours.</p>

<p>After setting your password, you can login to the observer portal and start submitting election results.</p>

<p>Best regards,<br>Election Management Team</p>`,
      description: 'Sent to observers when their application is approved',
      templateType: 'password_setup' as const,
      variables: {
        firstName: 'Observer first name',
        setupUrl: 'Password setup URL with token',
      },
    },
    {
      name: 'Welcome Email',
      subject: 'Welcome to Field Observer Portal',
      body: `<h2>Welcome {{firstName}}!</h2>
<p>Your field observer account is now active.</p>

<p>You can now login to the observer portal:</p>
<p><a href="{{loginUrl}}">Login to Observer Portal</a></p>

<p>Once logged in, you will:</p>
<ul>
  <li>See your assigned polling stations</li>
  <li>Submit election results</li>
  <li>Upload Form 34A photos</li>
  <li>Track your submissions</li>
</ul>

<p>The mobile app works offline, so you can submit results even without internet connection.</p>

<p>Best regards,<br>Election Management Team</p>`,
      description: 'Sent to observers after they set up their password',
      templateType: 'welcome' as const,
      variables: {
        firstName: 'Observer first name',
        loginUrl: 'Login page URL',
      },
    },
    {
      name: 'Rejection Notification',
      subject: 'Observer Application Status Update',
      body: `<h2>Hello {{firstName}},</h2>
<p>Thank you for your interest in becoming a field observer.</p>

<p>After careful review, we are unable to approve your application at this time.</p>

<p><strong>Reason:</strong> {{rejectionReason}}</p>

<p>If you believe this is an error or have questions, please contact our support team.</p>

<p>Best regards,<br>Election Management Team</p>`,
      description: 'Sent to observers when their application is rejected',
      templateType: 'rejection' as const,
      variables: {
        firstName: 'Observer first name',
        rejectionReason: 'Reason for rejection',
      },
    },
    {
      name: 'Clarification Request',
      subject: 'Observer Application - Additional Information Required',
      body: `<h2>Hello {{firstName}},</h2>
<p>We are reviewing your observer application and need some clarification:</p>

<p><strong>Notes:</strong></p>
<p>{{notes}}</p>

<p><strong>Application Tracking Number:</strong> {{trackingNumber}}</p>
<p>You can track your application status and provide the requested information at:</p>
<p><a href="{{trackingUrl}}">Track Application</a></p>

<p>Please visit the link above to view your application details and provide the requested information.</p>

<p>Best regards,<br>Election Management Team</p>`,
      description: 'Sent to observers when additional information is needed',
      templateType: 'clarification_request' as const,
      variables: {
        firstName: 'Observer first name',
        notes: 'Clarification notes',
        trackingNumber: 'Application tracking number',
        trackingUrl: 'Application tracking URL',
        appUrl: 'Application base URL',
      },
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { templateType: template.templateType },
      update: {
        name: template.name,
        subject: template.subject,
        body: template.body,
        description: template.description,
        variables: template.variables,
      },
      create: {
        name: template.name,
        subject: template.subject,
        body: template.body,
        description: template.description,
        templateType: template.templateType,
        variables: template.variables,
      },
    });
  }

  console.log('✅ Email templates seeded successfully');
}
