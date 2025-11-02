/**
 * Script to update the clarification request email template to include tracking link
 * Usage: npx ts-node scripts/update-clarification-email-template.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTemplate() {
  console.log('📧 Updating clarification request email template...\n');

  try {
    const updated = await prisma.emailTemplate.update({
      where: { templateType: 'clarification_request' },
      data: {
        body: `<h2>Hello {{firstName}},</h2>
<p>We are reviewing your observer application and need some clarification:</p>

<p><strong>Notes:</strong></p>
<p>{{notes}}</p>

<p><strong>Application Tracking Number:</strong> {{trackingNumber}}</p>
<p>You can track your application status and provide the requested information at:</p>
<p><a href="{{trackingUrl}}">Track Application</a></p>

<p>Please visit the link above to view your application details and provide the requested information.</p>

<p>Best regards,<br>Election Management Team</p>`,
        variables: {
          firstName: 'Observer first name',
          notes: 'Clarification notes',
          trackingNumber: 'Application tracking number',
          trackingUrl: 'Application tracking URL',
          appUrl: 'Application base URL',
        },
      },
    });

    console.log('✅ Clarification request email template updated successfully!');
    console.log('\nTemplate details:');
    console.log(`- Name: ${updated.name}`);
    console.log(`- Subject: ${updated.subject}`);
    console.log(`- Variables: ${JSON.stringify(updated.variables, null, 2)}`);
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('✗ Template not found. Please run email template seed first.');
    } else {
      console.error('✗ Error updating template:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

updateTemplate();

